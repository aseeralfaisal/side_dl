import asyncio
import logging
import threading
from datetime import datetime, timezone

from .config import POLL_INTERVAL
from .engines import EngineRegistry
from .engines.aria2 import extract_progress
from .models import JobStore

logger = logging.getLogger(__name__)


class BackgroundPoller:
    def __init__(self, registry: EngineRegistry, store: JobStore, loop: asyncio.AbstractEventLoop):
        self.registry = registry
        self.store = store
        self._loop = loop
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()

    def start(self):
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(
            target=self._run, daemon=True, name="dl-poller"
        )
        self._thread.start()
        logger.info("Background poller started")

    def stop(self):
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=3)
        logger.info("Background poller stopped")

    def _run(self):
        while not self._stop.is_set():
            try:
                engine = self.registry.get()
                future = asyncio.run_coroutine_threadsafe(engine.list_all(), self._loop)
                raw_list = future.result(timeout=10)

                gid_map: dict[str, dict] = {}
                for entry in raw_list:
                    gid = entry.get("gid")
                    if gid:
                        gid_map[gid] = engine.normalize_status(entry)

                for job in self.store.list():
                    canonical = gid_map.get(job.engine_job_id)
                    if canonical:
                        job.status = canonical["status"]
                        job.downloaded_bytes = canonical["completedLength"]
                        job.total_bytes = canonical["totalLength"] or None
                        job.speed = canonical["downloadSpeed"]
                        job.progress = extract_progress(canonical)
                        job.error = canonical.get("errorMessage") or None
                        job.updated_at = datetime.now(timezone.utc).isoformat()
                        self.store.put(job)
                    elif job.status not in (
                        "completed",
                        "failed",
                        "cancelled",
                    ):
                        job.error = "not found in download engine"
                        job.updated_at = datetime.now(timezone.utc).isoformat()
                        self.store.put(job)

            except Exception:
                logger.exception("Poller iteration failed")

            self._stop.wait(POLL_INTERVAL)
