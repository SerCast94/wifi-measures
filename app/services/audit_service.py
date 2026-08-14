from typing import List, Optional
from sqlalchemy.orm import Session
from app.api.linklive import LinkLiveClient
from app.database.models import Audit


class AuditService:
    def __init__(self, client: LinkLiveClient | None = None):
        self.client = client or LinkLiveClient()

    def sync_audits(self, db: Session, limit: Optional[int] = None) -> List[Audit]:
        """Download audits from Link-Live and store/update them in DB."""
        data = self.client.list_audits()
        items = data if isinstance(data, list) else data.get("items", [])
        saved = []
        count = 0
        for it in items:
            if limit and count >= limit:
                break
            audit_id = it.get("id") or it.get("audit_id") or str(it.get("uuid") or "")
            existing = db.query(Audit).filter(Audit.audit_id == audit_id).one_or_none()
            payload = {
                "audit_id": audit_id,
                "name": it.get("name"),
                "date": it.get("date"),
                "technician": it.get("technician") or it.get("user"),
                "device": it.get("device"),
                "audit_type": it.get("type"),
                "status": it.get("status"),
                "raw": it,
            }
            if existing:
                for k, v in payload.items():
                    setattr(existing, k, v)
                db.add(existing)
                saved.append(existing)
            else:
                a = Audit(**payload)
                db.add(a)
                saved.append(a)
            count += 1
        db.commit()
        return saved

    def list_local_audits(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(Audit).offset(skip).limit(limit).all()
