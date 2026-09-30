from datetime import datetime
from typing import Iterable, Tuple, Optional

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.models.consent import Consent

# Hours allowed for the receiving facility to ACKNOWLEDGE a referral
SLA_HOURS = {"EMERGENCY": 2, "URGENT": 24, "ROUTINE": 72}


def log_event(
    db: Session,
    referral_id: Optional[int],
    action: str,
    actor: dict,
    details: Optional[str] = None,
    notify: Iterable[Tuple[str, str, str]] = (),
):
    """Writes an audit log + event notifications. Caller commits."""
    db.add(AuditLog(
        referral_id=referral_id,
        action=action,
        actor=actor["user"],
        role=actor["role"],
        details=details,
    ))
    for recipient, channel, message in notify:
        db.add(Notification(
            referral_id=referral_id,
            recipient=recipient,
            channel=channel,
            message=message,
        ))


def has_consent(db: Session, patient_id: int) -> bool:
    now = datetime.now()
    consents = db.query(Consent).filter(
        Consent.patient_id == patient_id,
        Consent.status == "GRANTED",
    ).all()
    return any(c.expires_at is None or c.expires_at > now for c in consents)
