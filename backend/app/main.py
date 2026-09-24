from fastapi import FastAPI

from app.routers.patients import router as patient_router


app = FastAPI(title="SetuCare API")


app.include_router(patient_router)


@app.get("/")
def root():
    return {"message": "SetuCare backend is running"}