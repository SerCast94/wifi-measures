from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from jose.utils import base64url_decode
from app.core.config import settings
from app.core.token_store import TokenStore
from app.api.linklive import LinkLiveClient

ALGORITHM = "HS256"


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(tz=timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": int(expire.timestamp())})
    encoded = jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)
    return encoded


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def token_is_expired(token: str) -> bool:
    try:
        # Read exp claim without verifying signature
        unverified = jwt.get_unverified_claims(token)
        exp = unverified.get("exp")
        if exp is None:
            return True
        now = int(datetime.now(tz=timezone.utc).timestamp())
        return now >= int(exp)
    except Exception:
        return True


class TokenManager:
    """Manages Link-Live token lifecycle with a simple TokenStore and client refresh."""

    def __init__(self, client: LinkLiveClient | None = None, store: TokenStore | None = None):
        self.client = client or LinkLiveClient()
        self.store = store or TokenStore()

    def save_token_response(self, data: dict) -> None:
        # Expecting access_token and optional refresh_token
        info = {
            "access_token": data.get("access_token") or data.get("token"),
            "refresh_token": data.get("refresh_token"),
            "fetched_at": int(datetime.now(tz=timezone.utc).timestamp()),
        }
        self.store.save(info)

    def get_access_token(self) -> str:
        info = self.store.load()
        if not info or not info.get("access_token"):
            raise RuntimeError("No token stored; authentication required")
        token = info["access_token"]
        if token_is_expired(token):
            refresh = info.get("refresh_token")
            if not refresh:
                raise RuntimeError("Token expired and no refresh token available")
            new = self.client.refresh(refresh)
            self.save_token_response(new)
            return new.get("access_token") or new.get("token")
        return token

