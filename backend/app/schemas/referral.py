from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReferralCreate(BaseModel):
    patient_id: int
    from_facility: str
    to_facility: str
    reason: str
    service_required: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    priority: str = "ROUTINE"
    priority_reason: Optional[str] = None
    triage_score: Optional[int] = None


class AppointmentCreate(BaseModel):
    appointment_date: datetime

class TreatmentCreate(BaseModel):
    treatment_notes: str

class CounterReferralCreate(BaseModel):
    counter_referral_notes: str

class FollowUpCreate(BaseModel):
    follow_up_date: datetime
    follow_up_notes: str