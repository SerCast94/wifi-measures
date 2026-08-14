import json
from pathlib import Path
from typing import Optional
from app.core.config import settings


class TokenStore:
    def __init__(self, path: Optional[str] = None):
        self.path = Path(path or settings.token_store_file)

    def save(self, data: dict) -> None:
        self.path.write_text(json.dumps(data, ensure_ascii=False))

    def load(self) -> Optional[dict]:
        if not self.path.exists():
            return None
        try:
            return json.loads(self.path.read_text())
        except Exception:
            return None

    def clear(self) -> None:
        if self.path.exists():
            self.path.unlink()
