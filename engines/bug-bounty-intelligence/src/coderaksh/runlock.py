"""Cross-process lock so only one live run executes at a time.

Without it, two concurrent runs could both pass the budget check before either records its
spend, and together exceed the credit cap.
"""

from __future__ import annotations

import threading
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

from .errors import RunInProgress

try:  # POSIX
    import fcntl
except ImportError:  # pragma: no cover - Windows falls back to a per-process lock
    fcntl = None  # type: ignore[assignment]

_thread_lock = threading.Lock()


@contextmanager
def exclusive_run(data_dir: Path) -> Iterator[None]:
    if not _thread_lock.acquire(blocking=False):
        raise RunInProgress("another live run is in progress in this process")
    handle = None
    try:
        if fcntl is not None:
            handle = open(data_dir / "live.lock", "w")  # noqa: SIM115
            try:
                fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError as exc:
                raise RunInProgress("another live run holds the lock") from exc
        yield
    finally:
        if handle is not None:
            handle.close()  # closing releases the flock
        _thread_lock.release()
