from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base


class MedicineDispense(Base):
    __tablename__ = "medicine_dispenses"

    dispense_id = Column(Integer, primary_key=True, index=True)

    prescription_id = Column(
        Integer,
        ForeignKey("prescriptions.prescription_id"),
        nullable=False
    )

    inventory_id = Column(
        Integer,
        ForeignKey("medicine_inventory.inventory_id"),
        nullable=False
    )

    quantity = Column(Integer, nullable=False)

    dispensed_by = Column(String(50), nullable=False)

    dispensed_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )