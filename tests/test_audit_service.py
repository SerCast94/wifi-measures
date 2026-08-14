from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.session import Base
from app.services.audit_service import AuditService


class DummyClient:
    def list_audits(self):
        return [
            {"id": "a1", "name": "Audit 1", "date": None, "technician": "Tech1", "device": "ToolA", "type": "site", "status": "complete"},
            {"id": "a2", "name": "Audit 2", "date": None, "technician": "Tech2", "device": "ToolB", "type": "walk", "status": "complete"},
        ]


def test_sync_audits_into_db():
    engine = create_engine("sqlite:///:memory:")
    Session = sessionmaker(bind=engine)
    Base.metadata.create_all(engine)

    svc = AuditService(client=DummyClient())
    db = Session()
    saved = svc.sync_audits(db)
    assert len(saved) == 2
    # verify stored
    from app.database.models import Audit

    items = db.query(Audit).all()
    assert len(items) == 2
