from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.session import Base
from app.database.models import Audit
from app.services.report_service import ReportService
import os


def test_generate_report_creates_file_and_db_entry(tmp_path):
    engine = create_engine("sqlite:///:memory:")
    Session = sessionmaker(bind=engine)
    Base.metadata.create_all(engine)
    db = Session()
    # create audit
    a = Audit(audit_id="r1", name="Test Audit", status="ok", raw={"stats": {"rssi_mean": -60}})
    db.add(a)
    db.commit()

    outdir = tmp_path / "reports"
    svc = ReportService(output_dir=str(outdir))
    path = svc.generate_report("r1", db, generated_by="tester")
    assert os.path.exists(path)
    # verify report record
    from app.database.models import Report

    rpt = db.query(Report).filter(Report.audit_id == "r1").one_or_none()
    assert rpt is not None
