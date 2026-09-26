from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.referral import Referral
from app.schemas.referral import (
    ReferralCreate,
    AppointmentCreate,
    TreatmentCreate,
    CounterReferralCreate,
    FollowUpCreate
)

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


# Create Referral
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
        resource_type=referral.resource_type,
        resource_id=referral.resource_id,
        priority=referral.priority,
        priority_reason=referral.priority_reason,
        triage_score=referral.triage_score
    )

    db.add(new_referral)
    db.commit()
    db.refresh(new_referral)

    return new_referral


# Acknowledge Referral
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

    db.commit()
    db.refresh(referral)

    return referral


# Schedule Appointment
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


# Check In Patient
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


# Get Queue
@router.get("/queue")
def get_queue(
    resource_type: str,
    resource_id: str,
    db: Session = Depends(get_db)
):
    referrals = db.query(Referral).filter(
        Referral.status == "CHECKED_IN",
        Referral.resource_type == resource_type,
        Referral.resource_id == resource_id
    ).all()

    priority_order = {
        "EMERGENCY": 1,
        "URGENT": 2,
        "ROUTINE": 3
    }

    referrals.sort(
        key=lambda referral: priority_order.get(
            referral.priority.upper(), 3
        )
    )

    queue = []

    for position, referral in enumerate(referrals, start=1):
        queue.append({
            "queue_position": position,
            "referral_id": referral.referral_id,
            "patient_id": referral.patient_id,
            "priority": referral.priority,
            "service_required": referral.service_required,
            "resource_type": referral.resource_type,
            "resource_id": referral.resource_id,
            "status": referral.status
        })

    return queue
@router.patch("/{referral_id}/consultation")
def start_consultation(
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

    if referral.status != "CHECKED_IN":
        raise HTTPException(
            status_code=400,
            detail="Patient must be checked in before consultation"
        )

    referral.status = "IN_CONSULTATION"

    db.commit()
    db.refresh(referral)

    return referral
# Record Treatment
@router.patch("/{referral_id}/treatment")
def record_treatment(
    referral_id: int,
    treatment: TreatmentCreate,
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

    if referral.status != "IN_CONSULTATION":
        raise HTTPException(
            status_code=400,
            detail="Patient must be in consultation before recording treatment"
        )

    referral.treatment_notes = treatment.treatment_notes
    referral.status = "TREATMENT"

    db.commit()
    db.refresh(referral)

    return referral
# Create Counter Referral
@router.patch("/{referral_id}/counter-referral")
def create_counter_referral(
    referral_id: int,
    counter_referral: CounterReferralCreate,
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

    if referral.status != "TREATMENT":
        raise HTTPException(
            status_code=400,
            detail="Treatment must be completed before creating counter-referral"
        )

    referral.counter_referral_notes = (
        counter_referral.counter_referral_notes
    )
    referral.status = "COUNTER_REFERRAL"

    db.commit()
    db.refresh(referral)

    return referral
# Create Follow-Up
@router.patch("/{referral_id}/follow-up")
def create_follow_up(
    referral_id: int,
    follow_up: FollowUpCreate,
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

    if referral.status != "COUNTER_REFERRAL":
        raise HTTPException(
            status_code=400,
            detail="Counter-referral must be completed before creating follow-up"
        )

    referral.follow_up_date = follow_up.follow_up_date
    referral.follow_up_notes = follow_up.follow_up_notes
    referral.status = "FOLLOW_UP"

    db.commit()
    db.refresh(referral)

    return referral
@router.patch("/{referral_id}/complete")
def complete_referral(
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

    if referral.status != "FOLLOW_UP":
        raise HTTPException(
            status_code=400,
            detail="Follow-up must be created before completing referral"
        )

    referral.status = "COMPLETED"

    db.commit()
    db.refresh(referral)

    return referral