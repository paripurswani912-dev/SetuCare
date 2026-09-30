from sqlalchemy import Column, Integer, String
from app.database import Base


class Resource(Base):
    __tablename__ = "resources"

    resource_id = Column(Integer, primary_key=True, index=True)

    facility_name = Column(String(100), nullable=False)

    resource_type = Column(String(50), nullable=False)

    resource_name = Column(String(100), nullable=False)

    quantity = Column(Integer, nullable=False, default=0)

    status = Column(String(30), nullable=False, default="AVAILABLE")