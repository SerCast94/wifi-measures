from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.services.audit_service import AuditService
from app.database.session import get_db
from app.database.models import Audit

router = APIRouter()


@router.get("/sync")
def sync_audits(db: Session = Depends(get_db)):
    svc = AuditService()
    try:
        saved = svc.sync_audits(db)
        return {"synced": len(saved)}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/")
def list_audits(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    svc = AuditService()
    items = svc.list_local_audits(db, skip=skip, limit=limit)
    total = db.query(Audit).count()
    return {"items": items, "total": total}
