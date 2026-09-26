from pydantic import BaseModel


class MedicineInventoryCreate(BaseModel):
    medicine_name: str
    facility_name: str
    quantity: int