from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReferralCreate(BaseModel):
    patient_id: int
    from_facility: str
    to_facility: str
    reason: str
    service_required: str

    priority: str = "ROUTINE"
    priority_reason: Optional[str] = None
    triage_score: Optional[int] = None


class AppointmentCreate(BaseModel):
    appointment_date: datetime