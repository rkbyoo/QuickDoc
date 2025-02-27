# from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Time, Table, CheckConstraint
# from sqlalchemy.orm import relationship
# from .database import Base
# import sqlalchemy
#
# # Many-to-many relationship table
# doctor_specialty = Table(
#     "doctor_specialty",
#     Base.metadata,
#     Column("doctor_id", Integer, ForeignKey("doctors.id"), primary_key=True),
#     Column("specialty_id", Integer, ForeignKey("specialties.id"), primary_key=True)
# )
#
# class Specialty(Base):
#     """Represents a medical specialty."""
#     __tablename__ = "specialties"
#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, unique=True, index=True, nullable=False)
#     doctors = relationship("Doctor", secondary=doctor_specialty, back_populates="specialties")
#
# class Doctor(Base):
#     """Represents a doctor with their working hours and specialties."""
#     __tablename__ = "doctors"
#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, nullable=False, index=True)
#     start_time = Column(Time, nullable=False)
#     end_time = Column(Time, nullable=False)
#     on_leave = Column(Boolean, default=False)
#     max_appointments_per_day = Column(Integer, default=5)
#     specialties = relationship("Specialty", secondary=doctor_specialty, back_populates="doctors")
#     appointments = relationship("Appointment", back_populates="doctor")
#
#     __table_args__ = (
#         CheckConstraint("start_time < end_time", name="check_time_range"),
#     )
#
# class Appointment(Base):
#     """Represents a scheduled appointment with a doctor."""
#     __tablename__ = "appointments"
#     id = Column(Integer, primary_key=True, index=True)
#     user_name = Column(String, nullable=False)
#     phone = Column(String, nullable=False)
#     address = Column(String, nullable=False)
#     doctor_id = Column(Integer, ForeignKey("doctors.id"), index=True)
#     time = Column(DateTime, nullable=False, index=True)
#     doctor = relationship("Doctor", back_populates="appointments")
#
#     __table_args__ = (
#         sqlalchemy.UniqueConstraint("doctor_id", "time", name="unique_doctor_time"),
#     )
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Time, Table
from sqlalchemy.orm import relationship
from .database import Base

# Many-to-many relationship table
doctor_specialty = Table(
    "doctor_specialty",
    Base.metadata,
    Column("doctor_id", Integer, ForeignKey("doctors.id"), primary_key=True),
    Column("specialty_id", Integer, ForeignKey("specialties.id"), primary_key=True)
)

class Specialty(Base):
    __tablename__ = "specialties"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    doctors = relationship("Doctor", secondary=doctor_specialty, back_populates="specialties")

class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    start_time = Column(Time)  # e.g., 10:00 (10 AM)
    end_time = Column(Time)    # e.g., 16:00 (4 PM)
    on_leave = Column(Boolean, default=False)
    bio = Column(String, nullable=True)
    max_appointments_per_day = Column(Integer, default=5)
    specialties = relationship("Specialty", secondary=doctor_specialty, back_populates="doctors")

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String)
    phone = Column(String)
    address = Column(String)
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    time = Column(DateTime)
    is_confirmed = Column(Boolean, default=False)  # New flag: False until confirmed
    is_visited = Column(Boolean, default=False)