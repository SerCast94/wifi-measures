from datetime import timedelta
from app.core.security import create_access_token, decode_token, token_is_expired


def test_create_and_decode_token():
    payload = {"sub": "user1"}
    token = create_access_token(payload, expires_delta=timedelta(minutes=5))
    data = decode_token(token)
    assert data is not None
    assert data.get("sub") == "user1"


def test_token_expiration_check():
    token = create_access_token({"sub": "u"}, expires_delta=timedelta(seconds=1))
    assert token_is_expired(token) is False
