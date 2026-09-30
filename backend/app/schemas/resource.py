from pydantic import BaseModel


class ResourceCreate(BaseModel):
    facility_name: str
    resource_type: str
    resource_name: str
    quantity: int