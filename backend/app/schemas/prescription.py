from pydantic import BaseModel
from typing import Optional


class PrescriptionCreate(BaseModel):
    referral_id: int
    doctor_id: str
    medicine_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None