from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.routes import login, audits, reports, frontend

app = FastAPI(title=settings.app_name)

# API routers
app.include_router(login.router, prefix="/api/auth", tags=["auth"])
app.include_router(audits.router, prefix="/api/audits", tags=["audits"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

# Frontend router and static files
app.include_router(frontend.router)
app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
