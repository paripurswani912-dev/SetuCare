from fastapi import FastAPI

from app.routers.patients import router as patient_router
from app.routers.referrals import router as referral_router
from app.routers.prescriptions import router as prescription_router
from app.routers.medicine_inventory import router as medicine_inventory_router


app = FastAPI(title="SetuCare API")

app.include_router(patient_router)
app.include_router(referral_router)
app.include_router(prescription_router)
app.include_router(medicine_inventory_router)


@app.get("/")
def root():
    return {"message": "SetuCare backend is running"}