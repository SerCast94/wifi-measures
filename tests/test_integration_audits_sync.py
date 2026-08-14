from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from app.database.session import Base, get_db
from app.api.linklive import LinkLiveClient


def override_get_db_factory():
    engine = create_engine("sqlite:///:memory:", future=True)
    Session = sessionmaker(bind=engine)
    Base.metadata.create_all(engine)

    def _override_get_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    return _override_get_db


def test_audits_sync_integration(monkeypatch):
    # Prepare in-memory DB and override dependency
    app.dependency_overrides[get_db] = override_get_db_factory()

    # Mock the LinkLive client's list_audits to return sample data
    sample = [
        {"id": "int1", "name": "Integration Audit 1", "technician": "Alice", "device": "TL-1", "type": "site", "status": "complete"},
        {"id": "int2", "name": "Integration Audit 2", "technician": "Bob", "device": "TL-2", "type": "walk", "status": "complete"},
    ]

    monkeypatch.setattr(LinkLiveClient, "list_audits", lambda self, params=None: sample)

    client = TestClient(app)

    # Call sync endpoint
    resp = client.get("/api/audits/sync")
    assert resp.status_code == 200
    body = resp.json()
    assert body.get("synced") == 2

    # Verify audits are listed locally
    list_resp = client.get("/api/audits")
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert data.get("total") == 2

    # cleanup override
    app.dependency_overrides.pop(get_db, None)
