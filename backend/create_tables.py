from app.database import Base, engine
from app.models.patient import Patient

Base.metadata.create_all(bind=engine)

print("SUCCESS: Tables created!")
