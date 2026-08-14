from pydantic import BaseSettings, AnyUrl


class Settings(BaseSettings):
    app_name: str = "WiFi Audits"
    debug: bool = True
    secret_key: str = "CHANGEME"
    linklive_base_url: AnyUrl = "https://api.netally.com"
    linklive_token_url: str = "/auth/login"
    linklive_refresh_url: str = "/auth/refresh"
    linklive_client_id: str | None = None
    linklive_client_secret: str | None = None
    database_url: str = "postgresql://user:pass@localhost:5432/wifi_audits"
    access_token_expire_minutes: int = 60
    token_store_file: str = ".linklive_token.json"
    logo_path: str = "static/img/logo.png"
    timezone: str = "UTC"
    default_locale: str = "es"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
