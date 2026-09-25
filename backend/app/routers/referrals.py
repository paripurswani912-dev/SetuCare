from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.referral import Referral
from app.schemas.referral import ReferralCreate
from app.schemas.referral import ReferralCreate, AppointmentCreate


router = APIRouter(
    prefix="/referrals",
    tags=["Referrals"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_referral(
    referral: ReferralCreate,
    db: Session = Depends(get_db)
):
    new_referral = Referral(
        patient_id=referral.patient_id,
        from_facility=referral.from_facility,
        to_facility=referral.to_facility,
        reason=referral.reason,
        service_required=referral.service_required,
        priority=referral.priority,
        priority_reason=referral.priority_reason,
        triage_score=referral.triage_score
    )

    db.add(new_referral)
    db.commit()
    db.refresh(new_referral)

    return new_referral
@router.patch("/{referral_id}/acknowledge")
def acknowledge_referral(
    referral_id: int,
    db: Session = Depends(get_db)
):
    referral = db.query(Referral).filter(
        Referral.referral_id == referral_id
    ).first()

    if referral is None:
        raise HTTPException(
            status_code=404,
            detail="Referral not found"
        )

    referral.status = "ACKNOWLEDGED"
    referral.acknowledged_at = datetime.utcnow()
    appointment_date = Column(DateTime, nullable=True)

    db.commit()
    db.refresh(referral)

    return referral
@router.patch("/{referral_id}/appointment")
def schedule_appointment(
    referral_id: int,
    appointment: AppointmentCreate,
    db: Session = Depends(get_db)
):
    referral = db.query(Referral).filter(
        Referral.referral_id == referral_id
    ).first()

    if referral is None:
        raise HTTPException(
            status_code=404,
            detail="Referral not found"
        )

    if referral.status != "ACKNOWLEDGED":
        raise HTTPException(
            status_code=400,
            detail="Referral must be acknowledged before scheduling appointment"
        )

    referral.appointment_date = appointment.appointment_date
    referral.status = "APPOINTMENT"

    db.commit()
    db.refresh(referral)

    return referral
@router.patch("/{referral_id}/check-in")
def check_in_patient(
    referral_id: int,
    db: Session = Depends(get_db)
):
    referral = db.query(Referral).filter(
        Referral.referral_id == referral_id
    ).first()

    if referral is None:
        raise HTTPException(
            status_code=404,
            detail="Referral not found"
        )

    if referral.status != "APPOINTMENT":
        raise HTTPException(
            status_code=400,
            detail="Patient must have an appointment before check-in"
        )

    referral.status = "CHECKED_IN"

    db.commit()
    db.refresh(referral)

    return referral