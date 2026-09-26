from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    prescription_id = Column(Integer, primary_key=True, index=True)

    referral_id = Column(
        Integer,
        ForeignKey("referrals.referral_id"),
        nullable=False
    )

    doctor_id = Column(String(50), nullable=False)

    medicine_name = Column(String(100), nullable=False)

    dosage = Column(String(100), nullable=False)

    frequency = Column(String(100), nullable=False)

    duration = Column(String(100), nullable=False)

    instructions = Column(String(255), nullable=True)