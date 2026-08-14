from fastapi import APIRouter, HTTPException, Depends, Response
from sqlalchemy.orm import Session
from app.services.report_service import ReportService
from app.database.session import get_db
from app.database.models import Report as ReportModel
import os

router = APIRouter()


@router.post("/generate/{audit_id}")
def generate_report(audit_id: str, db: Session = Depends(get_db)):
    svc = ReportService()
    try:
        path = svc.generate_report(audit_id, db)
        # find persisted report record
        from app.database.models import Report as ReportModel

        rpt = db.query(ReportModel).filter(ReportModel.path == path).one_or_none()
        if rpt:
            return {"path": path, "report_id": rpt.id}
        return {"path": path}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/download/{report_id}")
def download_report(report_id: int, db: Session = Depends(get_db)):
    rpt = db.query(ReportModel).filter(ReportModel.id == report_id).one_or_none()
    if not rpt or not os.path.exists(rpt.path):
        raise HTTPException(status_code=404, detail="Report not found")
    with open(rpt.path, "rb") as fh:
        data = fh.read()
    return Response(content=data, media_type="application/pdf")
