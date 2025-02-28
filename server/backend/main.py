import json
from datetime import datetime

from fastapi import FastAPI, WebSocket, Depends, Request, HTTPException
from starlette.middleware.cors import CORSMiddleware
from .database import engine, get_db
from .models import Base, Appointment
from .services.chatbot import Chatbot, send_whatsapp_message
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import logging
import asyncio

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:3000",  # React dev server
    "http://127.0.0.1:3000",  # Alternative localhost
    "192.168.22.24"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Store active WebSocket connections and chatbots
chatbots = {}
MAX_CONNECTIONS = 100
KEEP_ALIVE_INTERVAL = 30  # Seconds

async def keep_alive(websocket: WebSocket):
    while True:
        await asyncio.sleep(KEEP_ALIVE_INTERVAL)
        await websocket.send_text("ping")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    if len(chatbots) >= MAX_CONNECTIONS:
        logger.warning("Too many active connections. Closing WebSocket.")
        await websocket.close(code=1008, reason="Too many active connections")
        return

    db = next(get_db())
    try:
        await websocket.accept()
        logger.info("WebSocket connection accepted")

        chatbot = Chatbot()
        chatbots[websocket] = chatbot
        asyncio.create_task(keep_alive(websocket))  # Start the keep-alive task

        logger.info("Sending initial message to client")
        await websocket.send_text("Hi! I’m here to help you book an appointment. What’s your name?")

        while True:
            data = await websocket.receive_text()
            logger.info(f"Received message from client: {data}")

            # Try to parse as JSON; fallback to plain text if it fails
            try:
                json_data = json.loads(data)
                if isinstance(json_data, dict) and "text" in json_data:
                    message = json_data["text"]
                    logger.info(f"Parsed JSON input: {message}")
                else:
                    await websocket.send_text("Error: Invalid JSON format. Use {'text': 'your_message'} or plain text")
                    continue
            except json.JSONDecodeError:
                # If not JSON, treat as plain text
                message = data
                logger.info(f"Treating as plain text input: {message}")
            except Exception as e:
                # If not JSON, treat as plain text
                message = data
                logger.info(f"Treating as plain text input: {message}")
            logger.info(f"Extracted message from client: {message}")
            if data == "pong":  # Ignore keep-alive responses
                continue

            response = await chatbot.process_message(message.strip(), db)
            logger.info(f"Sending response to client: {response}")
            await websocket.send_text(response)

            if chatbot.state == "done":
                logger.info("Chatbot state is 'done'. Closing connection.")
                break
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.send_text(f"Error: {str(e)}")
    finally:
        db.close()
        chatbots.pop(websocket, None)
        await websocket.close()
        logger.info("WebSocket connection closed")

@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.put("/appointments/{appointment_id}/confirm")
def confirm_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appointment.is_confirmed:
        raise HTTPException(status_code=400, detail="Appointment is already confirmed")

    appointment.is_confirmed = True
    db.commit()
    logger.info(f"Appointment {appointment_id} confirmed for {appointment.user_name} (phone: {appointment.phone})")
    return {"message": f"Appointment {appointment_id} confirmed successfully"}


# New endpoint to get all appointments for the current day
@app.get("/appointments/today")
def get_todays_appointments(db: Session = Depends(get_db)):
    """
    Retrieve all appointments for the current day with all columns.
    """
    # Get today's date range (midnight to midnight)
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999999)

    # Query appointments for today
    appointments = db.query(Appointment).filter(
        Appointment.time.between(today_start, today_end)
    ).all()

    if not appointments:
        logger.info("No appointments found for today")
        return {"message": "No appointments scheduled for today", "appointments": []}

    # Convert to a list of dictionaries with all columns
    result = [
        {
            "id": apt.id,
            "user_name": apt.user_name,
            "phone": apt.phone,
            "address": apt.address,
            "doctor_id": apt.doctor_id,
            "time": apt.time.isoformat(),  # Convert datetime to ISO string for JSON
            "is_confirmed": apt.is_confirmed,
            "is_visited": apt.is_visited
        }
        for apt in appointments
    ]

    logger.info(f"Found {len(result)} appointments for today")
    return {"appointments": result}


# New webhook endpoint for WhatsApp replies
@app.post("/whatsapp/webhook")
async def whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle incoming WhatsApp replies for confirmation or cancellation.
    """
    form_data = await request.form()
    message_body = form_data.get("Body", "").lower().strip()
    from_number = form_data.get("From", "").replace("whatsapp:", "")  # e.g., "+9191234567890"

    logger.info(f"Received WhatsApp reply from {from_number}: {message_body}")

    # Parse the message (e.g., "confirm 1" or "cancel 1")
    parts = message_body.split()
    if len(parts) != 2 or parts[0] not in ["confirm", "cancel"]:
        send_whatsapp_message(from_number, "Invalid reply. Please use 'confirm <id>' or 'cancel <id>' with your appointment ID.")
        return {"status": "invalid"}

    action = parts[0]
    try:
        appointment_id = int(parts[1])
    except ValueError:
        send_whatsapp_message(from_number, "Invalid appointment ID. Please include a valid number.")
        return {"status": "invalid"}

    # Match the appointment using the full phone number with country code
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.phone == from_number
    ).first()
    if not appointment:
        send_whatsapp_message(from_number, "Appointment not found or not associated with this number.")
        return {"status": "not_found"}

    if action == "confirm":
        if appointment.is_confirmed:
            send_whatsapp_message(from_number, "This appointment is already confirmed.")
            return {"status": "already_confirmed"}
        appointment.is_confirmed = True
        db.commit()
        send_whatsapp_message(from_number, f"Appointment {appointment_id} confirmed successfully!")
        logger.info(f"Appointment {appointment_id} confirmed via WhatsApp by {from_number}")
        return {"status": "confirmed"}

    elif action == "cancel":
        if appointment.is_confirmed:
            send_whatsapp_message(from_number, "Cannot cancel a confirmed appointment via WhatsApp. Contact support.")
            return {"status": "cannot_cancel"}
        db.delete(appointment)
        db.commit()
        send_whatsapp_message(from_number, f"Appointment {appointment_id} canceled successfully!")
        logger.info(f"Appointment {appointment_id} canceled via WhatsApp by {from_number}")
        return {"status": "canceled"}