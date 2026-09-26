from app.database import Base, engine

from app.models.patient import Patient
from app.models.referral import Referral
from app.models.prescription import Prescription
from app.models.medicine_inventory import MedicineInventory
from app.models.medicine_dispense import MedicineDispense



Base.metadata.create_all(bind=engine)

print("SUCCESS: Tables created!")