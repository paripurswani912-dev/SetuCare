from app.database import Base, engine

from app.models.patient import Patient
from app.models.referral import Referral
from app.models.prescription import Prescription
from app.models.medicine_inventory import MedicineInventory
from app.models.medicine_dispense import MedicineDispense
from app.models.resource import Resource
from app.models.audit_log import AuditLog
from app.models.consent import Consent
from app.models.notification import Notification

Base.metadata.create_all(bind=engine)

print("SUCCESS: Tables created!")
