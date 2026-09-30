from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func

from app.database import Base


class Referral(Base):
    __tablename__ = "referrals"

    referral_id = Column(Integer, primary_key=True, index=True)

    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)

    from_facility = Column(String(100), nullable=False)
    to_facility = Column(String(100), nullable=False)

    reason = Column(String(255), nullable=False)
    service_required = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(String(50), nullable=True)

    priority = Column(String(20), nullable=False, default="ROUTINE")
    priority_reason = Column(String(255), nullable=True)
    triage_score = Column(Integer, nullable=True)

    status = Column(String(30), nullable=False, default="CREATED")
    appointment_date = Column(DateTime, nullable=True)
    treatment_notes = Column(String(500), nullable=True)
    counter_referral_notes = Column(String(500), nullable=True)
    follow_up_date = Column(DateTime, nullable=True)
    follow_up_notes = Column(String(500), nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    acknowledged_at = Column(DateTime, nullable=True)

    # NEW: SLA tracking + escalation
    sla_deadline = Column(DateTime, nullable=True)
    escalated = Column(Boolean, nullable=False, default=False, server_default="0")
