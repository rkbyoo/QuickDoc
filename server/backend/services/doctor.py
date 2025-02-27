from sqlalchemy.orm import Session
from ..models import Doctor, Appointment, Specialty
from datetime import datetime, date, time, timedelta

class DoctorService:
    @staticmethod
    def get_available_slot(db: Session, specialty_name: str, start_date: date, end_date: date, slot_duration_minutes: int = 30):
        # Find the specialty
        specialty = db.query(Specialty).filter(Specialty.name.ilike(specialty_name)).first()
        if not specialty:
            return None, None

        # Query doctors with this specialty who are not on leave
        doctors = db.query(Doctor).join(Doctor.specialties).filter(
            Specialty.id == specialty.id,
            Doctor.on_leave == False
        ).all()

        current_date = start_date
        while current_date <= end_date:
            for doctor in doctors:
                # Count only confirmed appointments for this doctor on this date
                day_start = datetime.combine(current_date, time.min)
                day_end = datetime.combine(current_date, time.max)
                appointment_count = db.query(Appointment).filter(
                    Appointment.doctor_id == doctor.id,
                    Appointment.time.between(day_start, day_end),
                    Appointment.is_confirmed == True  # Only count confirmed appointments
                ).count()

                if appointment_count >= doctor.max_appointments_per_day:
                    continue

                # Generate available slots within doctor's time range
                start_dt = datetime.combine(current_date, doctor.start_time)
                end_dt = datetime.combine(current_date, doctor.end_time)
                current_slot = start_dt

                while current_slot < end_dt:
                    slot_taken = db.query(Appointment).filter(
                        Appointment.doctor_id == doctor.id,
                        Appointment.time == current_slot,
                        Appointment.is_confirmed == True  # Only confirmed appointments block slots
                    ).first()

                    if not slot_taken:
                        return doctor, current_slot
                    current_slot += timedelta(minutes=slot_duration_minutes)

            current_date += timedelta(days=1)

        return None, None  # No available slot found
# from sqlalchemy.orm import Session
# from ..models import Doctor, Appointment, Specialty
# from datetime import datetime, date, time, timedelta
#
# class DoctorService:
#     @staticmethod
#     def get_available_slot(db: Session, specialty_name: str, start_date: date, end_date: date, slot_duration_minutes: int = 30):
#         # Find the specialty
#         specialty = db.query(Specialty).filter(Specialty.name.ilike(specialty_name)).first()
#         if not specialty:
#             return None, None
#
#         # Query doctors with this specialty who are not on leave
#         doctors = db.query(Doctor).join(Doctor.specialties).filter(
#             Specialty.id == specialty.id,
#             Doctor.on_leave == False
#         ).all()
#
#         current_date = start_date
#         while current_date <= end_date:
#             for doctor in doctors:
#                 # Count appointments for this doctor on this date
#                 day_start = datetime.combine(current_date, time.min)
#                 day_end = datetime.combine(current_date, time.max)
#                 appointment_count = db.query(Appointment).filter(
#                     Appointment.doctor_id == doctor.id,
#                     Appointment.time.between(day_start, day_end)
#                 ).count()
#
#                 if appointment_count >= doctor.max_appointments_per_day:
#                     continue
#
#                 # Generate available slots within doctor's time range
#                 start_dt = datetime.combine(current_date, doctor.start_time)
#                 end_dt = datetime.combine(current_date, doctor.end_time)
#                 current_slot = start_dt
#
#                 while current_slot < end_dt:
#                     slot_taken = db.query(Appointment).filter(
#                         Appointment.doctor_id == doctor.id,
#                         Appointment.time == current_slot
#                     ).first()
#
#                     if not slot_taken:
#                         return doctor, current_slot
#                     current_slot += timedelta(minutes=slot_duration_minutes)
#
#             current_date += timedelta(days=1)
#
#         return None, None  # No available slot found