from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class MedicineInventory(Base):
    __tablename__ = "medicine_inventory"

    inventory_id = Column(Integer, primary_key=True, index=True)

    medicine_name = Column(String(100), nullable=False)

    facility_name = Column(String(100), nullable=False)

    quantity = Column(Integer, nullable=False, default=0)

    status = Column(String(30), nullable=False, default="AVAILABLE")

    prescription_id = Column(
    Integer,
    ForeignKey("prescriptions.prescription_id"),
    nullable=True
    )

