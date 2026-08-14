from fastapi import APIRouter, HTTPException, Depends
from app.schemas.auth import LoginRequest, Token
from app.services.authentication_service import AuthenticationService
from app.database.session import SessionLocal

router = APIRouter()


@router.post("/login", response_model=Token)
def login_view(payload: LoginRequest):
    svc = AuthenticationService()
    try:
        data = svc.authenticate_and_store(payload.username, payload.password, session_factory=SessionLocal)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    token = data.get("access_token") or data.get("token")
    return {"access_token": token, "token_type": "bearer"}


@router.post("/refresh", response_model=Token)
def refresh_view():
    svc = AuthenticationService()
    try:
        token = svc.get_access_token(session_factory=SessionLocal)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"access_token": token, "token_type": "bearer"}
