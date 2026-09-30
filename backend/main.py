from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.patients import router as patient_router
from app.routers.referrals import router as referral_router
from app.routers.prescriptions import router as prescription_router
from app.routers.medicine_inventory import router as medicine_inventory_router
from app.routers.resources import router as resource_router
from app.routers.consents import router as consent_router
from app.routers.monitoring import router as monitoring_router

app = FastAPI(title="SetuCare API")

# REQUIRED so the frontend (localhost:3000) can call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
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
