import logging
import time
from typing import Optional, Any, Dict

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app.core.config import settings

logger = logging.getLogger(__name__)


class LinkLiveClient:
    def __init__(self, base_url: Optional[str] = None, timeout: int = 10, max_retries: int = 3):
        self.base_url = base_url or str(settings.linklive_base_url)
        self.token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.timeout = timeout

        # Prepare a requests.Session with retry/backoff
        self.session = requests.Session()
        retries = Retry(
            total=max_retries,
            backoff_factor=0.5,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=("GET", "POST", "PUT", "DELETE", "PATCH"),
        )
        adapter = HTTPAdapter(max_retries=retries)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)

    def authenticate(self, username: str, password: str) -> Dict[str, Any]:
        """Authenticate against Link-Live and store token. Adjust endpoint per API docs."""
        url = f"{self.base_url}{settings.linklive_token_url}"
        payload = {"username": username, "password": password}
        resp = self._request("post", url, json=payload, require_auth=False)
        data = resp.json()
        self.token = data.get("access_token") or data.get("token")
        self.refresh_token = data.get("refresh_token")
        return data

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    def _request(self, method: str, url: str, require_auth: bool = True, **kwargs) -> requests.Response:
        kwargs.setdefault("timeout", self.timeout)
        if require_auth and self.token:
            headers = kwargs.pop("headers", {})
            headers.update(self._headers())
            kwargs["headers"] = headers

        resp = self.session.request(method, url, **kwargs)

        # If unauthorized, attempt refresh once
        if resp.status_code == 401 and self.refresh_token:
            logger.info("Access token expired, attempting refresh")
            try:
                self.refresh(self.refresh_token)
            except Exception as exc:  # refresh failed
                logger.warning("Token refresh failed: %s", exc)
                resp.raise_for_status()

            # retry the original request with new token
            if require_auth and self.token:
                headers = kwargs.pop("headers", {})
                headers.update(self._headers())
                kwargs["headers"] = headers
            resp = self.session.request(method, url, **kwargs)

        resp.raise_for_status()
        return resp

    def list_audits(self, params: dict | None = None) -> Dict[str, Any]:
        url = f"{self.base_url}/audits"
        resp = self._request("get", url, params=params)
        return resp.json()

    def get_audit(self, audit_id: str) -> Dict[str, Any]:
        url = f"{self.base_url}/audits/{audit_id}"
        resp = self._request("get", url)
        return resp.json()

    def refresh(self, refresh_token: Optional[str] = None) -> Dict[str, Any]:
        """Refresh access token using refresh_token; endpoint may vary."""
        token_to_use = refresh_token or self.refresh_token
        if not token_to_use:
            raise ValueError("No refresh token available")

        url = f"{self.base_url}{settings.linklive_refresh_url}"
        resp = self._request("post", url, require_auth=False, json={"refresh_token": token_to_use})
        data = resp.json()
        self.token = data.get("access_token") or data.get("token")
        self.refresh_token = data.get("refresh_token")
        return data
