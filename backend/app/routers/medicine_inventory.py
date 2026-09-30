from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.medicine_inventory import MedicineInventory
from app.schemas.medicine_inventory import MedicineInventoryCreate
from fastapi import HTTPException
from app.models.prescription import Prescription
from app.models.medicine_dispense import MedicineDispense

router = APIRouter(
    prefix="/medicine-inventory",
    tags=["Medicine Inventory"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def add_medicine(
    medicine: MedicineInventoryCreate,
    db: Session = Depends(get_db)
):
    status = "AVAILABLE" if medicine.quantity > 0 else "OUT_OF_STOCK"

    new_medicine = MedicineInventory(
        medicine_name=medicine.medicine_name,
        facility_name=medicine.facility_name,
        quantity=medicine.quantity,
        status=status
    )

    db.add(new_medicine)
    db.commit()
    db.refresh(new_medicine)

    return new_medicine
@router.get("/")
def get_medicine_availability(
    medicine_name: str,
    facility_name: str,
    db: Session = Depends(get_db)
):
    medicine = db.query(MedicineInventory).filter(
        MedicineInventory.medicine_name == medicine_name,
        MedicineInventory.facility_name == facility_name
    ).first()

    if medicine is None:
        return {
            "medicine_name": medicine_name,
            "facility_name": facility_name,
            "status": "NOT_FOUND",
            "quantity": 0
        }

    return medicine
@router.patch("/{inventory_id}/dispense")
def dispense_medicine(
    inventory_id: int,
    prescription_id: int,
    quantity: int,
    dispensed_by: str,
    db: Session = Depends(get_db)
):
    medicine = db.query(MedicineInventory).filter(
        MedicineInventory.inventory_id == inventory_id
    ).first()

    if medicine is None:
        raise HTTPException(
            status_code=404,
            detail="Medicine inventory record not found"
        )

    prescription = db.query(Prescription).filter(
        Prescription.prescription_id == prescription_id
    ).first()

    if prescription is None:
        raise HTTPException(
            status_code=404,
            detail="Prescription not found"
        )

    if medicine.medicine_name != prescription.medicine_name:
        raise HTTPException(
            status_code=400,
            detail="Medicine does not match prescription"
        )

    if quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0"
        )

    if quantity > medicine.quantity:
        raise HTTPException(
            status_code=400,
            detail="Not enough medicine in stock"
        )

    medicine.quantity -= quantity

    if medicine.quantity == 0:
        medicine.status = "OUT_OF_STOCK"
    else:
        medicine.status = "AVAILABLE"

    dispense = MedicineDispense(
        prescription_id=prescription_id,
        inventory_id=inventory_id,
        quantity=quantity,
        dispensed_by=dispensed_by
    )

    db.add(dispense)
    db.commit()
    db.refresh(dispense)

    return {
        "message": "Medicine dispensed successfully",
        "dispense_id": dispense.dispense_id,
        "prescription_id": prescription_id,
        "medicine_name": medicine.medicine_name,
        "quantity_dispensed": quantity,
        "remaining_stock": medicine.quantity,
        "dispensed_by": dispensed_by
    }
@router.get("/dispensing-history/{prescription_id}")
def get_dispensing_history(
    prescription_id: int,
    db: Session = Depends(get_db)
):
    history = db.query(MedicineDispense).filter(
        MedicineDispense.prescription_id == prescription_id
    ).all()

    return history
@router.get("/all")
def list_inventory(facility_name: str = None, db: Session = Depends(get_db)):
    q = db.query(MedicineInventory)
    if facility_name:
        q = q.filter(MedicineInventory.facility_name == facility_name)
    return q.order_by(MedicineInventory.inventory_id.desc()).all()