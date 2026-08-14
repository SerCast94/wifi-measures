from typing import Optional
from app.api.linklive import LinkLiveClient
from app.core.token_store_db import DBTokenStore
from app.core.security import TokenManager


class AuthenticationService:
    def __init__(self, client: Optional[LinkLiveClient] = None):
        self.client = client or LinkLiveClient()

    def authenticate_and_store(self, username: str, password: str, session_factory=None) -> dict:
        """Authenticate with Link-Live, store tokens via DBTokenStore, and return token response."""
        data = self.client.authenticate(username, password)
        # attach fetched_at
        if isinstance(data, dict):
            data.setdefault("fetched_at", None)
        store = DBTokenStore(session_factory=session_factory)
        store.save(data)
        return data

    def get_access_token(self, session_factory=None) -> str:
        store = DBTokenStore(session_factory=session_factory)
        token_manager = TokenManager(client=self.client, store=store)
        return token_manager.get_access_token()
