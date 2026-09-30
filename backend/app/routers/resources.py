from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.resource import Resource
from app.schemas.resource import ResourceCreate

router = APIRouter(prefix="/resources", tags=["Resources"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_resource(resource: ResourceCreate, db: Session = Depends(get_db)):
    status = "AVAILABLE" if resource.quantity > 0 else "UNAVAILABLE"
    new_resource = Resource(
        facility_name=resource.facility_name,
        resource_type=resource.resource_type,
        resource_name=resource.resource_name,
        quantity=resource.quantity,
        status=status,
    )
    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)
    return new_resource


@router.get("/")
def list_resources(facility_name: Optional[str] = None, resource_type: Optional[str] = None,
                   db: Session = Depends(get_db)):
    q = db.query(Resource)
    if facility_name:
        q = q.filter(Resource.facility_name == facility_name)
    if resource_type:
        q = q.filter(Resource.resource_type == resource_type)
    return q.order_by(Resource.resource_id.desc()).all()


# Facility matching: "which facility has this resource available right now?"
@router.get("/match")
def match_facility(resource_type: str, db: Session = Depends(get_db)):
    rows = db.query(Resource).filter(
        Resource.resource_type == resource_type,
        Resource.status == "AVAILABLE",
        Resource.quantity > 0,
    ).order_by(Resource.quantity.desc()).all()
    return [
        {"resource_id": r.resource_id, "facility_name": r.facility_name,
         "resource_name": r.resource_name, "available": r.quantity}
        for r in rows
    ]


@router.patch("/{resource_id}/quantity")
def update_quantity(resource_id: int, quantity: int, db: Session = Depends(get_db)):
    r = db.query(Resource).filter(Resource.resource_id == resource_id).first()
    if r is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    if quantity < 0:
        raise HTTPException(status_code=400, detail="Quantity cannot be negative")
    r.quantity = quantity
    r.status = "AVAILABLE" if quantity > 0 else "UNAVAILABLE"
    db.commit()
    db.refresh(r)
    return r
