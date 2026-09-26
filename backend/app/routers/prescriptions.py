from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.prescription import Prescription
from app.schemas.prescription import PrescriptionCreate
from app.models.medicine_inventory import MedicineInventory


router = APIRouter(
    prefix="/prescriptions",
    tags=["Prescriptions"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_prescription(
    prescription: PrescriptionCreate,
    db: Session = Depends(get_db)
):
    new_prescription = Prescription(
        referral_id=prescription.referral_id,
        doctor_id=prescription.doctor_id,
        medicine_name=prescription.medicine_name,
        dosage=prescription.dosage,
        frequency=prescription.frequency,
        duration=prescription.duration,
        instructions=prescription.instructions
    )

    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)

    return new_prescription
@router.get("/{prescription_id}/availability")
def check_prescription_availability(
    prescription_id: int,
    facility_name: str,
    db: Session = Depends(get_db)
):
    prescription = db.query(Prescription).filter(
        Prescription.prescription_id == prescription_id
    ).first()

    if prescription is None:
        raise HTTPException(
            status_code=404,
            detail="Prescription not found"
        )

    medicine = db.query(MedicineInventory).filter(
        MedicineInventory.medicine_name == prescription.medicine_name,
        MedicineInventory.facility_name == facility_name
    ).first()

    if medicine is None:
        return {
            "prescription_id": prescription.prescription_id,
            "medicine_name": prescription.medicine_name,
            "facility_name": facility_name,
            "availability": "NOT_FOUND",
            "quantity": 0
        }

    return {
        "prescription_id": prescription.prescription_id,
        "medicine_name": prescription.medicine_name,
        "facility_name": facility_name,
        "availability": medicine.status,
        "quantity": medicine.quantity
    }