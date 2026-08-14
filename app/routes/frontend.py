from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


@router.get("/")
def login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request, "title": "Login"})


@router.get("/dashboard")
def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request, "title": "Dashboard"})


@router.get("/audits")
def audits(request: Request):
    return templates.TemplateResponse("audits.html", {"request": request, "title": "Auditorías"})
