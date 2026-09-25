from app.database import Base, engine

from app.models.patient import Patient
from app.models.referral import Referral


Base.metadata.create_all(bind=engine)

print("SUCCESS: Tables created!")