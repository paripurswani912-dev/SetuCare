import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.database import SessionLocal, Base, engine
from app.routers.patients import router as patient_router
from app.routers.referrals import router as referral_router
from app.routers.prescriptions import router as prescription_router
from app.routers.medicine_inventory import router as medicine_inventory_router
from app.routers.resources import router as resource_router
from app.routers.consents import router as consent_router
from app.routers.monitoring import router as monitoring_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create database tables on startup if they don't exist
    try:
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
        print("Database tables created/verified on startup.")
    except Exception as e:
        print(f"Startup DB Table Creation Warning: {e}")
    yield


app = FastAPI(title="SetuCare API", lifespan=lifespan)

# Read ALLOWED_ORIGINS from environment variable (comma-separated)
raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "https://setucare-7.onrender.com,http://localhost:3000",
)
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
    allow_credentials=True if "*" not in allowed_origins else False,
    allow_methods=["*"],
    allow_headers=["*", "X-Role", "X-User"],
)

app.include_router(patient_router)
app.include_router(referral_router)
app.include_router(prescription_router)
app.include_router(medicine_inventory_router)
app.include_router(resource_router)
app.include_router(consent_router)
app.include_router(monitoring_router)


@app.get("/")
def root():
    return {"message": "SetuCare backend is running"}


@app.get("/health")
def health_check():
    db_status = "healthy"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    status_code = 200 if db_status == "healthy" else 500
    return JSONResponse(
        status_code=status_code,
        content={"status": "ok" if db_status == "healthy" else "error", "database": db_status},
    )

