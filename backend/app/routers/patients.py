from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.patient import Patient
from app.schemas.patient import PatientCreate
from app.security import require_role
from app.services.events import log_event

router = APIRouter(prefix="/patients", tags=["Patients"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db),
    actor: dict = Depends(require_role("ASHA", "DOCTOR", "FACILITY_ADMIN")),
):
    # Duplicate check = "fewer duplicate submissions"
    if patient.abha_id:
        existing = db.query(Patient).filter(Patient.abha_id == patient.abha_id).first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail={
                    "message": "Patient already registered - reusing existing record",
                    "patient_id": existing.patient_id,
                },
            )
    if patient.phone:
        existing = db.query(Patient).filter(
            Patient.phone == patient.phone, Patient.name == patient.name
        ).first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail={
                    "message": "Possible duplicate (same name + phone)",
                    "patient_id": existing.patient_id,
                },
            )

    new_patient = Patient(**patient.model_dump())
    db.add(new_patient)
    db.flush()
    log_event(db, None, "PATIENT_REGISTERED", actor, f"patient_id={new_patient.patient_id}")
    db.commit()
    db.refresh(new_patient)
    return new_patient


@router.get("/")
def search_patients(
    q: Optional[str] = None,
    abha_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Patient)
    if abha_id:
        query = query.filter(Patient.abha_id == abha_id)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Patient.name.like(like)) | (Patient.phone.like(like)) | (Patient.abha_id.like(like))
        )
    return query.order_by(Patient.patient_id.desc()).limit(50).all()


@router.get("/{patient_id}")
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if p is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return p
