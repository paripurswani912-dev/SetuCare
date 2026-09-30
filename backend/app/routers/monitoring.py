from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.referral import Referral
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.security import require_role
from app.services.events import log_event

router = APIRouter(tags=["Monitoring"])

STATUSES = ["CREATED", "ACKNOWLEDGED", "APPOINTMENT", "CHECKED_IN", "IN_CONSULTATION",
            "TREATMENT", "COUNTER_REFERRAL", "FOLLOW_UP", "COMPLETED"]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _breached(r: Referral, now: datetime) -> bool:
    return bool(r.sla_deadline and r.status == "CREATED" and now > r.sla_deadline)


@router.get("/dashboard/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    referrals = db.query(Referral).all()
    now = datetime.now()
    total = len(referrals)

    by_status = {s: 0 for s in STATUSES}
    by_priority = {"EMERGENCY": 0, "URGENT": 0, "ROUTINE": 0}
    by_facility = {}
    ack_minutes = []

    for r in referrals:
        by_status[r.status] = by_status.get(r.status, 0) + 1
        by_priority[r.priority] = by_priority.get(r.priority, 0) + 1
        by_facility[r.to_facility] = by_facility.get(r.to_facility, 0) + 1
        if r.acknowledged_at and r.created_at:
            ack_minutes.append((r.acknowledged_at - r.created_at).total_seconds() / 60)

    breached = [r for r in referrals if _breached(r, now)]
    with_deadline = [r for r in referrals if r.sla_deadline]
    ack_within_sla = [r for r in with_deadline if r.acknowledged_at and r.acknowledged_at <= r.sla_deadline]
    completed = by_status["COMPLETED"]

    return {
        "total_referrals": total,
        "completed": completed,
        "completion_rate": round(completed / total * 100, 1) if total else 0,
        "pending": total - completed,
        "sla_breached": len(breached),
        "escalated": sum(1 for r in referrals if r.escalated),
        "sla_compliance_rate": round(len(ack_within_sla) / len(with_deadline) * 100, 1) if with_deadline else 100,
        "avg_ack_minutes": round(sum(ack_minutes) / len(ack_minutes), 1) if ack_minutes else 0,
        "by_status": by_status,
        "by_priority": by_priority,
        "by_facility": by_facility,
    }


@router.get("/dashboard/sla-breaches")
def sla_breaches(db: Session = Depends(get_db)):
    now = datetime.now()
    rows = db.query(Referral).filter(Referral.status == "CREATED").all()
    return [
        {
            "referral_id": r.referral_id, "to_facility": r.to_facility, "priority": r.priority,
            "sla_deadline": r.sla_deadline, "escalated": r.escalated,
            "hours_overdue": round((now - r.sla_deadline).total_seconds() / 3600, 1),
        }
        for r in rows if _breached(r, now)
    ]


@router.post("/sla/check")
def run_sla_check(
    db: Session = Depends(get_db),
    actor: dict = Depends(require_role("DISTRICT_MANAGER", "FACILITY_ADMIN")),
):
    """Escalates every un-acknowledged referral that crossed its SLA deadline.
    Call from the dashboard 'Run SLA check' button (or a cron job)."""
    now = datetime.now()
    newly = []
    for r in db.query(Referral).filter(Referral.status == "CREATED", Referral.escalated == False).all():  # noqa: E712
        if _breached(r, now):
            r.escalated = True
            log_event(db, r.referral_id, "SLA_ESCALATED", actor,
                      f"Not acknowledged by {r.to_facility} before {r.sla_deadline}",
                      notify=[
                          ("DISTRICT", "DASHBOARD",
                           f"ESCALATION: referral #{r.referral_id} ({r.priority}) unacknowledged by {r.to_facility}"),
                          (r.to_facility, "SMS", f"URGENT reminder: acknowledge referral #{r.referral_id}"),
                      ])
            newly.append(r.referral_id)
    db.commit()
    return {"escalated_now": newly, "count": len(newly)}


@router.get("/audit-logs")
def audit_logs(referral_id: Optional[int] = None, limit: int = 100, db: Session = Depends(get_db),
               actor: dict = Depends(require_role("DISTRICT_MANAGER", "FACILITY_ADMIN"))):
    q = db.query(AuditLog)
    if referral_id:
        q = q.filter(AuditLog.referral_id == referral_id)
    return q.order_by(AuditLog.log_id.desc()).limit(limit).all()


@router.get("/notifications")
def notifications(recipient: Optional[str] = None, referral_id: Optional[int] = None,
                  limit: int = 50, db: Session = Depends(get_db)):
    q = db.query(Notification)
    if recipient:
        q = q.filter(Notification.recipient == recipient)
    if referral_id:
        q = q.filter(Notification.referral_id == referral_id)
    return q.order_by(Notification.notification_id.desc()).limit(limit).all()
