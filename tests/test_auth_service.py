from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.session import Base
from app.services.authentication_service import AuthenticationService


class DummyClient:
    def authenticate(self, username, password):
        return {
            "access_token": "dummy-access",
            "refresh_token": "dummy-refresh",
            "fetched_at": 1,
        }


def test_authenticate_and_store_in_db():
    engine = create_engine("sqlite:///:memory:")
    Session = sessionmaker(bind=engine)
    Base.metadata.create_all(engine)

    svc = AuthenticationService(client=DummyClient())
    resp = svc.authenticate_and_store("u", "p", session_factory=Session)
    assert resp.get("access_token") == "dummy-access"
