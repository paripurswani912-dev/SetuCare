from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    referral_id = Column(Integer, nullable=True, index=True)
    action = Column(String(50), nullable=False)
    actor = Column(String(50), nullable=False)
    role = Column(String(30), nullable=False)
    details = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
