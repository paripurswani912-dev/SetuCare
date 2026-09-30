from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Consent(Base):
    __tablename__ = "consents"

    consent_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    purpose = Column(String(100), nullable=False, default="REFERRAL")
    granted_to = Column(String(100), nullable=False, default="ALL_FACILITIES")
    status = Column(String(20), nullable=False, default="GRANTED")  # GRANTED / REVOKED
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    expires_at = Column(DateTime, nullable=True)
