"""SQLite response cache. Tapline charges for every request, so repeats should be free."""

from __future__ import annotations

import hashlib
import json
import sqlite3
import threading
import time
from pathlib import Path
from typing import Any

from .policy import template_for

DAY = 86400
TTL_SECONDS: dict[str, int] = {
    "/v1/brave-search/news": 1 * DAY,
    "/v1/brave-search/search": 3 * DAY,
    "/v1/linkedin/company": 7 * DAY,
    "/v1/linkedin/company/posts": 3 * DAY,
    "/v1/linkedin/jobs/search": 3 * DAY,
    "/v1/linkedin/job": 7 * DAY,
    "/v1/linkedin/post": 14 * DAY,
    "/v1/twitter/profile": 7 * DAY,
    "/v1/twitter/user-tweets": 1 * DAY,
    "/v1/twitter/tweet": 14 * DAY,
    "/v1/youtube/search": 7 * DAY,
    "/v1/youtube/channels/{channel_id}/videos": 7 * DAY,
    "/v1/youtube/videos/{video_id}/metadata": 30 * DAY,
    "/v1/youtube/videos/{video_id}/subtitles": 30 * DAY,
    "/free/nvd": 1 * DAY,
    "/free/kev": 1 * DAY,
    "/free/epss": 1 * DAY,
    "/free/osv": 1 * DAY,
    "/free/ghsa": 1 * DAY,
}
DEFAULT_TTL = 3 * DAY


def cache_key(path: str, query: dict | None) -> str:
    payload = json.dumps([path.strip("/"), query or {}], sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode()).hexdigest()


class Cache:
    def __init__(self, db_path: str | Path, clock=time.time):
        self._clock = clock
        self._lock = threading.Lock()
        self._db = sqlite3.connect(str(db_path), check_same_thread=False)
        self._db.execute(
            "CREATE TABLE IF NOT EXISTS cache ("
            "key TEXT PRIMARY KEY, path TEXT NOT NULL, stored_at REAL NOT NULL, "
            "credits INTEGER NOT NULL, body TEXT NOT NULL)"
        )
        self._db.commit()

    def ttl_for(self, path: str) -> int:
        return TTL_SECONDS.get(template_for(path), DEFAULT_TTL)

    def get(self, path: str, query: dict | None) -> tuple[Any, int] | None:
        """Return (body, credits_originally_charged) or None when missing or expired."""
        key = cache_key(path, query)
        with self._lock:
            row = self._db.execute(
                "SELECT stored_at, credits, body FROM cache WHERE key=?", (key,)
            ).fetchone()
        if not row:
            return None
        stored_at, credits, body = row
        if self._clock() - stored_at > self.ttl_for(path):
            return None
        return json.loads(body), int(credits)

    def put(self, path: str, query: dict | None, body: Any, credits: int) -> None:
        with self._lock:
            self._db.execute(
                "INSERT OR REPLACE INTO cache(key, path, stored_at, credits, body) VALUES(?,?,?,?,?)",
                (cache_key(path, query), path, self._clock(), credits, json.dumps(body)),
            )
            self._db.commit()

    def purge_expired(self) -> int:
        removed = 0
        with self._lock:
            rows = self._db.execute("SELECT key, path, stored_at FROM cache").fetchall()
            for key, path, stored_at in rows:
                if self._clock() - stored_at > self.ttl_for(path):
                    self._db.execute("DELETE FROM cache WHERE key=?", (key,))
                    removed += 1
            self._db.commit()
        return removed

    def close(self) -> None:
        with self._lock:
            self._db.close()
