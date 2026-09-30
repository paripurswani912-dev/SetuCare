from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.consent import Consent
from app.models.patient import Patient
from app.security import require_role
from app.services.events import log_event

router = APIRouter(prefix="/consents", tags=["Consent"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ConsentCreate(BaseModel):
    patient_id: int
    purpose: str = "REFERRAL"
    granted_to: str = "ALL_FACILITIES"
    valid_days: Optional[int] = 365


@router.post("/")
def grant_consent(
    body: ConsentCreate,
    db: Session = Depends(get_db),
    actor: dict = Depends(require_role("ASHA", "DOCTOR", "FACILITY_ADMIN")),
):
    if not db.query(Patient).filter(Patient.patient_id == body.patient_id).first():
        raise HTTPException(status_code=404, detail="Patient not found")
    consent = Consent(
        patient_id=body.patient_id,
        purpose=body.purpose,
        granted_to=body.granted_to,
        status="GRANTED",
        expires_at=datetime.now() + timedelta(days=body.valid_days) if body.valid_days else None,
    )
    db.add(consent)
    log_event(db, None, "CONSENT_GRANTED", actor, f"patient_id={body.patient_id}, purpose={body.purpose}")
    db.commit()
    db.refresh(consent)
    return consent


@router.get("/patient/{patient_id}")
def patient_consents(patient_id: int, db: Session = Depends(get_db)):
    return db.query(Consent).filter(Consent.patient_id == patient_id) \
        .order_by(Consent.consent_id.desc()).all()


@router.patch("/{consent_id}/revoke")
def revoke_consent(
    consent_id: int,
    db: Session = Depends(get_db),
    actor: dict = Depends(require_role("ASHA", "DOCTOR", "FACILITY_ADMIN")),
):
    consent = db.query(Consent).filter(Consent.consent_id == consent_id).first()
    if consent is None:
        raise HTTPException(status_code=404, detail="Consent not found")
    consent.status = "REVOKED"
    log_event(db, None, "CONSENT_REVOKED", actor, f"patient_id={consent.patient_id}")
    db.commit()
    db.refresh(consent)
    return consent
