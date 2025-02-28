from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv
import os
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from dateutil import parser
from ..models import Appointment, Specialty, Doctor
from .doctor import DoctorService
from datetime import datetime
import logging
import re
import asyncio
from langchain.globals import set_verbose
from twilio.rest import Client

set_verbose(True)
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=os.getenv("GOOGLE_API_KEY"))

twilio_client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER")

# Define prompt and chain globally with separator
prompt = PromptTemplate(
    input_variables=["symptoms", "available_doctors"],
    template="Based on the following symptoms: {symptoms}, select the most appropriate doctor from this list of available doctors: {available_doctors}. Respond with the doctor's name, specialty, and ID separated by '*', e.g., 'Dr. John Smith * Cardiologist * 1'."
)
chain = prompt | llm | StrOutputParser()

def send_whatsapp_message(to_number: str, body: str):
    try:
        message = twilio_client.messages.create(
            body=body,
            from_=TWILIO_WHATSAPP_NUMBER,
            to=f"whatsapp:{to_number}"
        )
        logger.info(f"WhatsApp message sent to {to_number}. SID: {message.sid}")
    except Exception as e:
        logger.error(f"Failed to send WhatsApp message to {to_number}: {str(e)}")

def parse_date(date_str):
    try:
        dt = parser.parse(date_str, dayfirst=True)
        return dt.date()
    except ValueError:
        raise ValueError("Invalid date format")

def parse_date_input(input_str):
    separators = [" to ", "-", " - "]
    for sep in separators:
        if sep in input_str:
            parts = input_str.split(sep, 1)
            start_str = parts[0].strip()
            end_str = parts[1].strip()
            try:
                start_date = parse_date(start_str)
                end_date = parse_date(end_str)
                if start_date > end_date:
                    raise ValueError("Start date must be before or equal to end date")
                return start_date, end_date
            except ValueError:
                pass
    try:
        single_date = parse_date(input_str)
        return single_date, single_date
    except ValueError:
        raise ValueError("Invalid date format")

def validate_phone(phone):
    if not re.match(r"^\+?[0-9]{10,15}$", phone):
        raise ValueError("Invalid phone number format. Please include country code (e.g., +91XXXXXXXXXX)")
    if not phone.startswith('+'):
        return f"+91{phone}"  # Default to +91, adjust as needed
    return phone

def validate_address(address):
    if len(address.strip()) < 5:
        raise ValueError("Address is too short")

class Chatbot:
    def __init__(self):
        self.state = "awaiting_name"
        self.user_data = {}

    async def process_message(self, message, db):
        try:
            if self.state == "awaiting_name":
                self.user_data["name"] = message.strip()
                if not self.user_data["name"]:
                    return "Please provide a valid name."
                self.state = "awaiting_phone"
                return "Great! What’s your phone number?"

            elif self.state == "awaiting_phone":
                self.user_data["phone"] = validate_phone(message)
                self.state = "awaiting_address"
                return "Thanks! What’s your address?"

            elif self.state == "awaiting_address":
                validate_address(message)
                self.user_data["address"] = message
                self.state = "awaiting_date_range"
                return "Please specify your preferred date range or a single date (e.g., '10 Feb 2025 to 20 Feb 2025' or '10 Feb 2025')."

            elif self.state == "awaiting_date_range":
                start_date, end_date = parse_date_input(message)
                self.user_data["start_date"] = start_date
                self.user_data["end_date"] = end_date
                self.state = "awaiting_symptoms"
                return "Thank you! Please describe your symptoms so I can find the best doctor for you."

            elif self.state == "awaiting_symptoms":
                # Step 1: Query available doctors by ID
                doctors = []
                specialties = db.query(Specialty).all()
                for specialty in specialties:
                    doctor, slot_time = await asyncio.to_thread(
                        DoctorService.get_available_slot,
                        db, specialty.name, self.user_data["start_date"], self.user_data["end_date"]
                    )
                    if doctor and slot_time:
                        doctors.append((doctor.id, doctor.name, slot_time, specialty.name))

                if not doctors:
                    return "No doctors are available in your date range. Please try a different range."

                # Step 2: Format available doctors for LLM with separator
                available_doctors_str = ", ".join(
                    f"{doctor_name} * {specialty} * {doctor_id}"
                    for doctor_id, doctor_name, _, specialty in doctors
                )
                logger.info(f"Available doctors: {available_doctors_str}")

                # Step 3: Pass symptoms and available doctors to LLM
                logger.info(f"Entering LLM -> Symptoms: {message}, Doctors: {available_doctors_str}")
                selected_doctor_response = await asyncio.to_thread(
                    chain.invoke, {"symptoms": message, "available_doctors": available_doctors_str}
                )
                logger.info(f"From LLM -> Selected doctor: {selected_doctor_response}")

                # Step 4: Parse LLM response using separator
                try:
                    selected_doctor_name, selected_doctor_specialty, selected_doctor_id = [
                        part.strip() for part in selected_doctor_response.split("*")
                    ]
                    selected_doctor_id = int(selected_doctor_id)
                except (ValueError, IndexError):
                    return "Invalid response from doctor selection. Please try again with clear symptoms."

                # Step 5: Map selected doctor ID to details
                selected_slot = None
                selected_doctor_full_name = None
                selected_doctor_specialty = None
                for doctor_id, doctor_name, slot_time, specialty in doctors:
                    if doctor_id == selected_doctor_id:
                        selected_slot = slot_time
                        selected_doctor_full_name = doctor_name
                        selected_doctor_specialty = specialty
                        break

                if selected_slot is None:
                    return "The selected doctor is not available. Please try again or adjust your symptoms."

                # Step 6: Check for existing appointments
                today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                existing_confirmed = db.query(Appointment).filter(
                    Appointment.phone == self.user_data["phone"],
                    Appointment.is_confirmed == True
                ).first()

                if existing_confirmed:
                    existing_time_str = existing_confirmed.time.strftime("%d %b %Y at %I:%M %p")
                    return f"You already have a confirmed appointment on {existing_time_str}. Please cancel it first or use a different phone number."

                existing_unconfirmed_future = db.query(Appointment).filter(
                    Appointment.phone == self.user_data["phone"],
                    Appointment.is_confirmed == False,
                    Appointment.time > today
                ).first()

                if existing_unconfirmed_future:
                    existing_time_str = existing_unconfirmed_future.time.strftime("%d %b %Y at %I:%M %p")
                    return f"You already have an unconfirmed appointment scheduled for {existing_time_str}. Please confirm or cancel it before booking a new one."

                # Step 7: Book the appointment if no conflict
                try:
                    appointment = Appointment(
                        user_name=self.user_data["name"],
                        phone=self.user_data["phone"],
                        address=self.user_data["address"],
                        doctor_id=selected_doctor_id,
                        time=selected_slot,
                        is_confirmed=False,
                        is_visited=False
                    )
                    db.add(appointment)
                    db.flush()

                    doctor = db.query(Doctor).filter(Doctor.id == selected_doctor_id).first()
                    bio = doctor.bio if doctor.bio else "No bio available."
                    specialty = selected_doctor_specialty

                    slot_str = selected_slot.strftime("%d %b %Y at %I:%M %p")
                    logger.info(f"Appointment booked for {self.user_data['name']} with {selected_doctor_full_name} (ID: {selected_doctor_id}) on {slot_str}, confirmed: False, visited: False, appointment ID: {appointment.id}")

                    whatsapp_message = (
                        f"Hello {self.user_data['name']}, your appointment with {selected_doctor_full_name} "
                        f"on {slot_str} has been booked.\n"
                        f"Doctor Bio: {bio}\n"
                        f"To confirm, reply 'confirm {appointment.id}'. To cancel, reply 'cancel {appointment.id}'."
                    )
                    send_whatsapp_message(self.user_data["phone"], whatsapp_message)

                    db.commit()
                    response = (
                        f"You’ve been booked with {selected_doctor_full_name} on {slot_str}. "
                        f"Your appointment is not yet confirmed. Check WhatsApp for details.\n\n"
                        f"Doctor Summary:\n"
                        f"- Name: {selected_doctor_full_name}\n"
                        f"- Specialty: {specialty}\n"
                        f"- Bio: {bio}"
                    )

                    self.state = "done"
                    return response
                except Exception as e:
                    db.rollback()
                    logger.error(f"Database error: {str(e)}")
                    return "An error occurred while booking your appointment. Please try again later."

        except ValueError as e:
            return str(e)
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return "Something went wrong. Please try again later."