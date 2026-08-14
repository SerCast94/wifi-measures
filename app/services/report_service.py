import os
from datetime import datetime
from typing import Optional
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session
from app.database.models import Audit, Report
from app.core.config import settings


class ReportService:
    def __init__(self, output_dir: Optional[str] = None):
        self.output_dir = output_dir or "reports"
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_report(self, audit_id: str, db: Session, generated_by: Optional[str] = None) -> str:
        audit = db.query(Audit).filter(Audit.audit_id == audit_id).one_or_none()
        if not audit:
            raise RuntimeError("Audit not found")

        filename = f"report_{audit_id}_{int(datetime.utcnow().timestamp())}.pdf"
        path = os.path.join(self.output_dir, filename)

        c = canvas.Canvas(path, pagesize=A4)
        width, height = A4

        # Cover
        c.setFont("Helvetica-Bold", 20)
        c.drawCentredString(width / 2, height - 80, settings.app_name)
        c.setFont("Helvetica", 14)
        c.drawCentredString(width / 2, height - 110, "Informe de Auditoría Wi‑Fi")
        c.setFont("Helvetica", 12)
        c.drawString(80, height - 160, f"Auditoría: {audit.name or audit.audit_id}")
        c.drawString(80, height - 180, f"Fecha: {audit.date}")
        c.drawString(80, height - 200, f"Técnico: {audit.technician}")
        c.drawString(80, height - 220, f"Equipo: {audit.device}")

        c.showPage()

        # Summary page
        c.setFont("Helvetica-Bold", 16)
        c.drawString(80, height - 80, "Resumen")
        c.setFont("Helvetica", 11)
        raw = audit.raw or {}
        stats = raw.get("stats") or {}
        y = height - 120
        c.drawString(80, y, f"Estado: {audit.status}")
        y -= 20
        c.drawString(80, y, f"Tipo: {audit.audit_type}")
        y -= 30
        # Add a few example stats if present
        for k in ("rssi_mean", "snr_mean", "num_aps"):
            v = stats.get(k)
            if v is not None:
                c.drawString(80, y, f"{k}: {v}")
                y -= 18

        c.showPage()
        c.save()

        # Persist report record
        rpt = Report(audit_id=audit.audit_id, path=path, generated_by=generated_by)
        db.add(rpt)
        db.commit()
        return path
