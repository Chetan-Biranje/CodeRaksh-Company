"""Credit ledger and budget guard (hard cap plus circuit breaker)."""

from __future__ import annotations

import sqlite3
import threading
import time
from pathlib import Path

from .config import CIRCUIT_BREAKER_RATIO, PILOT_HARD_CAP
from .errors import BudgetExceeded, CircuitOpen


class Ledger:
    def __init__(self, db_path: str | Path, clock=time.time):
        self._clock = clock
        self._lock = threading.Lock()
        self._db = sqlite3.connect(str(db_path), check_same_thread=False)
        self._db.execute(
            "CREATE TABLE IF NOT EXISTS calls ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT, ts REAL NOT NULL, run_id TEXT NOT NULL, "
            "program TEXT NOT NULL, mode TEXT NOT NULL, path TEXT NOT NULL, "
            "credits INTEGER NOT NULL, cache_hit INTEGER NOT NULL, status TEXT NOT NULL)"
        )
        self._db.commit()

    def record(
        self, *, run_id: str, program: str, mode: str, path: str,
        credits: int, cache_hit: bool, status: str = "ok",
    ) -> None:
        with self._lock:
            self._db.execute(
                "INSERT INTO calls(ts, run_id, program, mode, path, credits, cache_hit, status) "
                "VALUES(?,?,?,?,?,?,?,?)",
                (self._clock(), run_id, program, mode, path, credits, int(cache_hit), status),
            )
            self._db.commit()

    def spent(self, *, run_id: str | None = None, program: str | None = None,
              mode: str | None = None) -> int:
        """Credits actually spent (cache hits excluded)."""
        return self._sum(run_id, program, mode, cache_hit=0)

    def saved(self, *, run_id: str | None = None, program: str | None = None,
              mode: str | None = None) -> int:
        """Credits avoided thanks to the cache."""
        return self._sum(run_id, program, mode, cache_hit=1)

    def _sum(self, run_id, program, mode, cache_hit) -> int:
        # Static SQL with optional filters (NULL means "any"), so no string building.
        sql = (
            "SELECT COALESCE(SUM(credits),0) FROM calls WHERE cache_hit=? "
            "AND (? IS NULL OR run_id=?) AND (? IS NULL OR program=?) AND (? IS NULL OR mode=?)"
        )
        args = [cache_hit, run_id, run_id, program, program, mode, mode]
        with self._lock:
            return int(self._db.execute(sql, args).fetchone()[0])

    def summary(self, *, program: str | None = None) -> list[dict]:
        sql = ("SELECT path, mode, COUNT(*), SUM(CASE WHEN cache_hit=0 THEN credits ELSE 0 END), "
               "SUM(cache_hit) FROM calls")
        args: list = []
        if program:
            sql += " WHERE program=?"
            args.append(program)
        sql += " GROUP BY path, mode ORDER BY 4 DESC"
        with self._lock:
            rows = self._db.execute(sql, args).fetchall()
        return [{"path": r[0], "mode": r[1], "calls": r[2], "credits": r[3], "cache_hits": r[4]}
                for r in rows]

    def close(self) -> None:
        with self._lock:
            self._db.close()


class BudgetGuard:
    """Authorises each call before it is made.

    `cap` limits one run. `program_cap` (live mode) limits everything ever spent on the program
    in live mode, so repeated runs cannot exceed the pilot budget. Neither can exceed 500.
    """

    def __init__(self, ledger: Ledger, *, run_id: str, program: str, mode: str, cap: int,
                 program_cap: int | None = None):
        self.ledger, self.run_id, self.program, self.mode = ledger, run_id, program, mode
        self.cap = max(0, min(cap, PILOT_HARD_CAP))
        self.program_cap = None if program_cap is None else max(0, min(program_cap, PILOT_HARD_CAP))

    @property
    def spent(self) -> int:
        return self.ledger.spent(run_id=self.run_id)

    @property
    def program_spent(self) -> int:
        return self.ledger.spent(program=self.program, mode=self.mode)

    @property
    def remaining(self) -> int:
        left = self.cap - self.spent
        if self.program_cap is not None:
            left = min(left, self.program_cap - self.program_spent)
        return max(0, left)

    def _check(self, total: int, cap: int, priority: int, what: str) -> None:
        if total > cap:
            raise BudgetExceeded(f"{what} cap would be exceeded ({total} > {cap})")
        if priority > 0 and total > cap * CIRCUIT_BREAKER_RATIO:
            raise CircuitOpen(
                f"circuit breaker: {what} spend {total} > {int(CIRCUIT_BREAKER_RATIO * 100)}% of {cap}"
            )

    def authorize(self, cost: int, priority: int = 1) -> None:
        self._check(self.spent + cost, self.cap, priority, "run")
        if self.program_cap is not None:
            self._check(self.program_spent + cost, self.program_cap, priority, "pilot")

    def record(self, path: str, credits: int, *, cache_hit: bool, status: str = "ok") -> None:
        self.ledger.record(run_id=self.run_id, program=self.program, mode=self.mode,
                           path=path, credits=credits, cache_hit=cache_hit, status=status)
