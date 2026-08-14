from typing import Optional
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.database.models import Token as TokenModel


class DBTokenStore:
    def __init__(self, session_factory: Optional[callable] = None, service_name: str = "linklive"):
        self.session_factory = session_factory or SessionLocal
        self.service_name = service_name

    def save(self, data: dict) -> None:
        db: Session = self.session_factory()
        try:
            existing = db.query(TokenModel).filter(TokenModel.service_name == self.service_name).one_or_none()
            if existing:
                existing.access_token = data.get("access_token") or data.get("token")
                existing.refresh_token = data.get("refresh_token")
                existing.fetched_at = data.get("fetched_at")
            else:
                t = TokenModel(
                    service_name=self.service_name,
                    access_token=data.get("access_token") or data.get("token"),
                    refresh_token=data.get("refresh_token"),
                    fetched_at=data.get("fetched_at"),
                )
                db.add(t)
            db.commit()
        finally:
            db.close()

    def load(self) -> Optional[dict]:
        db: Session = self.session_factory()
        try:
            existing = db.query(TokenModel).filter(TokenModel.service_name == self.service_name).one_or_none()
            if not existing:
                return None
            return {
                "access_token": existing.access_token,
                "refresh_token": existing.refresh_token,
                "fetched_at": existing.fetched_at,
            }
        finally:
            db.close()

    def clear(self) -> None:
        db: Session = self.session_factory()
        try:
            db.query(TokenModel).filter(TokenModel.service_name == self.service_name).delete()
            db.commit()
        finally:
            db.close()
