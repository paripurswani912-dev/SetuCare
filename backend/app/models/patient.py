from sqlalchemy import Column, Integer, String
from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    patient_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    phone = Column(String(15), nullable=True)
    abha_id = Column(String(50), nullable=True, unique=True)