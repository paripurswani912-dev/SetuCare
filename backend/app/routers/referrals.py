from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.referral import Referral
from app.models.patient import Patient
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.schemas.referral import (
    ReferralCreate,
    AppointmentCreate,
    TreatmentCreate,
    CounterReferralCreate,
    FollowUpCreate,
)
from app.security import require_role
from app.services.events import log_event, has_consent, SLA_HOURS

router = APIRouter(prefix="/referrals", tags=["Referrals"])

FRONTLINE = ("ASHA", "DOCTOR", "FACILITY_ADMIN")
FACILITY = ("FACILITY_ADMIN",)
CLINICAL = ("DOCTOR",)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_referral_or_404(db: Session, referral_id: int) -> Referral:
    referral = db.query(Referral).filter(Referral.referral_id == referral_id).first()
    if referral is None:
        raise HTTPException(status_code=404, detail="Referral not found")
    return referral


def require_status(referral: Referral, expected: str, message: str):
    if referral.status != expected:
        raise HTTPException(status_code=400, detail=message)


# ---------------- Create Referral ----------------
@router.post("/")
def create_referral(
    referral: ReferralCreate,
    db: Session = Depends(get_db),
    actor: dict = Depends(require_role(*FRONTLINE)),
):
    patient = db.query(Patient).filter(Patient.patient_id == referral.patient_id).first()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Consent-based data sharing (comment these 2 lines out to disable)
    if not has_consent(db, referral.patient_id):
        raise HTTPException(status_code=403, detail="Patient consent required before referral")

    priority = (referral.priority or "ROUTINE").upper()
    if priority not in SLA_HOURS:
        raise HTTPException(status_code=400, detail="Priority must be EMERGENCY, URGENT or ROUTINE")

    now = datetime.now()
    data = referral.model_dump()
    data["priority"] = priority

    new_referral = Referral(
        **data,
        created_at=now,
        sla_deadline=now + timedelta(hours=SLA_HOURS[priority]),
    )
    db.add(new_referral)
    db.flush()  # get referral_id

    log_event(
        db, new_referral.referral_id, "CREATED", actor,
        f"{referral.from_facility} -> {referral.to_facility} [{priority}]",
        notify=[
            (referral.to_facility, "DASHBOARD",
             f"New {priority} referral #{new_referral.referral_id} for {referral.service_required}"),
            ("PATIENT", "SMS",
             f"Your referral #{new_referral.referral_id} to {referral.to_facility} has been created."),
        ],
    )
    db.commit()
    db.refresh(new_referral)
    return new_referral


# ---------------- Lists ----------------
@router.get("/")
def list_referrals(
    status: Optional[str] = None,
    facility: Optional[str] = None,
    priority: Optional[str] = None,
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Referral)
    if status:
        q = q.filter(Referral.status == status.upper())
    if priority:
        q = q.filter(Referral.priority == priority.upper())
    if patient_id:
        q = q.filter(Referral.patient_id == patient_id)
    if facility:
        q = q.filter((Referral.to_facility == facility) | (Referral.from_facility == facility))
    return q.order_by(Referral.referral_id.desc()).all()


@router.get("/queue")
def get_queue(resource_type: str, resource_id: str, db: Session = Depends(get_db)):
    referrals = db.query(Referral).filter(
        Referral.status == "CHECKED_IN",
        Referral.resource_type == resource_type,
        Referral.resource_id == resource_id,
    ).all()

    priority_order = {"EMERGENCY": 1, "URGENT": 2, "ROUTINE": 3}
    referrals.sort(key=lambda r: (priority_order.get(r.priority.upper(), 3), r.referral_id))

    return [
        {
            "queue_position": pos,
            "referral_id": r.referral_id,
            "patient_id": r.patient_id,
            "priority": r.priority,
            "service_required": r.service_required,
            "resource_type": r.resource_type,
            "resource_id": r.resource_id,
            "status": r.status,
        }
        for pos, r in enumerate(referrals, start=1)
    ]


# ---------------- Unified tracking (one ID -> full journey) ----------------
@router.get("/{referral_id}/timeline")
def referral_timeline(referral_id: int, db: Session = Depends(get_db)):
    r = get_referral_or_404(db, referral_id)
    patient = db.query(Patient).filter(Patient.patient_id == r.patient_id).first()
    consent = has_consent(db, r.patient_id)

    # Patient details are masked if consent is revoked/expired
    if patient and consent:
        patient_view = {
            "patient_id": patient.patient_id, "name": patient.name, "age": patient.age,
            "gender": patient.gender, "phone": patient.phone, "abha_id": patient.abha_id,
        }
    else:
        patient_view = {"patient_id": r.patient_id, "name": "*** consent required ***"}

    events = db.query(AuditLog).filter(AuditLog.referral_id == referral_id) \
        .order_by(AuditLog.log_id).all()
    notifications = db.query(Notification).filter(Notification.referral_id == referral_id) \
        .order_by(Notification.notification_id).all()

    now = datetime.now()
    sla_breached = bool(r.sla_deadline and r.status == "CREATED" and now > r.sla_deadline)

    return {
        "referral": r,
        "patient": patient_view,
        "consent_active": consent,
        "sla_breached": sla_breached,
        "events": events,
        "notifications": notifications,
    }


# ---------------- Lifecycle ----------------
@router.patch("/{referral_id}/acknowledge")
def acknowledge_referral(
    referral_id: int,
    db: Session = Depends(get_db),
    actor: dict = Depends(require_role(*FACILITY)),
):
    r = get_referral_or_404(db, referral_id)
    require_status(r, "CREATED", "Only newly created referrals can be acknowledged")
    r.status = "ACKNOWLEDGED"
    r.acknowledged_at = datetime.now()
    log_event(db, r.referral_id, "ACKNOWLEDGED", actor, r.to_facility, notify=[
        (r.from_facility, "DASHBOARD", f"Referral #{r.referral_id} acknowledged by {r.to_facility}"),
        ("ASHA", "PUSH", f"Referral #{r.referral_id} received by facility"),
    ])
    db.commit()
    db.refresh(r)
    return r


@router.patch("/{referral_id}/appointment")
def schedule_appointment(
    referral_id: int,
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
    actor: dict = Depends(require_role(*FACILITY)),
):
    r = get_referral_or_404(db, referral_id)
    require_status(r, "ACKNOWLEDGED", "Referral must be acknowledged before scheduling appointment")
    r.appointment_date = appointment.appointment_date
    r.status = "APPOINTMENT"
    log_event(db, r.referral_id, "APPOINTMENT_SCHEDULED", actor,
              str(appointment.appointment_date), notify=[
        ("PATIENT", "SMS", f"Appointment for referral #{r.referral_id} on "
                           f"{appointment.appointment_date:%d %b %Y %H:%M} at {r.to_facility}"),
        ("ASHA", "PUSH", f"Appointment fixed for referral #{r.referral_id}"),
    ])
    db.commit()
    db.refresh(r)
    return r


@router.patch("/{referral_id}/check-in")
def check_in_patient(
    referral_id: int,
    db: Session = Depends(get_db),
    actor: dict = Depends(require_role(*FACILITY)),
):
    r = get_referral_or_404(db, referral_id)
    require_status(r, "APPOINTMENT", "Patient must have an appointment before check-in")
    r.status = "CHECKED_IN"
    log_event(db, r.referral_id, "CHECKED_IN", actor, r.to_facility)
    db.commit()
    db.refresh(r)
    return r


@router.patch("/{referral_id}/consultation")
def start_consultation(
    referral_id: int,
    db: Session = Depends(get_db),
    actor: dict = Depends(require_role(*CLINICAL)),
):
    r = get_referral_or_404(db, referral_id)
    require_status(r, "CHECKED_IN", "Patient must be checked in before consultation")
    r.status = "IN_CONSULTATION"
    log_event(db, r.referral_id, "CONSULTATION_STARTED", actor)
    db.commit()
    db.refresh(r)
    return r


@router.patch("/{referral_id}/treatment")
def record_treatment(
    referral_id: int,
    treatment: TreatmentCreate,
    db: Session = Depends(get_db),
    actor: dict = Depends(require_role(*CLINICAL)),
):
    r = get_referral_or_404(db, referral_id)
    require_status(r, "IN_CONSULTATION", "Patient must be in consultation before recording treatment")
    r.treatment_notes = treatment.treatment_notes
    r.status = "TREATMENT"
    log_event(db, r.referral_id, "TREATMENT_RECORDED", actor)
    db.commit()
    db.refresh(r)
    return r


@router.patch("/{referral_id}/counter-referral")
def create_counter_referral(
    referral_id: int,
    counter_referral: CounterReferralCreate,
    db: Session = Depends(get_db),
    actor: dict = Depends(require_role(*CLINICAL)),
):
    r = get_referral_or_404(db, referral_id)
    require_status(r, "TREATMENT", "Treatment must be completed before creating counter-referral")
    r.counter_referral_notes = counter_referral.counter_referral_notes
    r.status = "COUNTER_REFERRAL"
    log_event(db, r.referral_id, "COUNTER_REFERRAL", actor, notify=[
        (r.from_facility, "DASHBOARD",
         f"Counter-referral received for #{r.referral_id}: patient treated at {r.to_facility}"),
    ])
    db.commit()
    db.refresh(r)
    return r


@router.patch("/{referral_id}/follow-up")
def create_follow_up(
    referral_id: int,
    follow_up: FollowUpCreate,
    db: Session = Depends(get_db),
    actor: dict = Depends(require_role(*FRONTLINE)),
):
    r = get_referral_or_404(db, referral_id)
    require_status(r, "COUNTER_REFERRAL", "Counter-referral must be completed before creating follow-up")
    r.follow_up_date = follow_up.follow_up_date
    r.follow_up_notes = follow_up.follow_up_notes
    r.status = "FOLLOW_UP"
    log_event(db, r.referral_id, "FOLLOW_UP_SCHEDULED", actor, str(follow_up.follow_up_date), notify=[
        ("PATIENT", "SMS", f"Follow-up visit for referral #{r.referral_id} on "
                           f"{follow_up.follow_up_date:%d %b %Y}"),
        ("ASHA", "PUSH", f"Follow-up task: referral #{r.referral_id} on {follow_up.follow_up_date:%d %b}"),
    ])
    db.commit()
    db.refresh(r)
    return r


@router.patch("/{referral_id}/complete")
def complete_referral(
    referral_id: int,
    db: Session = Depends(get_db),
    actor: dict = Depends(require_role(*FRONTLINE)),
):
    r = get_referral_or_404(db, referral_id)
    require_status(r, "FOLLOW_UP", "Follow-up must be created before completing referral")
    r.status = "COMPLETED"
    log_event(db, r.referral_id, "COMPLETED", actor, "Care journey closed", notify=[
        ("DISTRICT", "DASHBOARD", f"Referral #{r.referral_id} closed successfully"),
    ])
    db.commit()
    db.refresh(r)
    return r
