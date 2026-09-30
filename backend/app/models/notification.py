from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, index=True)
    referral_id = Column(Integer, nullable=True, index=True)
    recipient = Column(String(100), nullable=False)   # facility name / PATIENT / ASHA / DISTRICT
    channel = Column(String(20), nullable=False, default="DASHBOARD")  # SMS / PUSH / DASHBOARD
    message = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False, default="SENT")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
