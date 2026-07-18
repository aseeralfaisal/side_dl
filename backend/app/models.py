from dataclasses import dataclass, asdict
import threading


@dataclass
class DownloadJob:
    id: str
    url: str
    filename: str
    engine: str
    engine_job_id: str
    status: str
    progress: float = 0.0
    downloaded_bytes: int = 0
    total_bytes: int | None = None
    speed: int = 0
    error: str | None = None
    created_at: str = ""
    updated_at: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


class JobStore:
    def __init__(self):
        self._jobs: dict[str, DownloadJob] = {}
        self._lock = threading.Lock()

    def get(self, id: str) -> DownloadJob | None:
        with self._lock:
            return self._jobs.get(id)

    def list(self) -> list[DownloadJob]:
        with self._lock:
            return list(self._jobs.values())

    def put(self, job: DownloadJob):
        with self._lock:
            self._jobs[job.id] = job

    def remove(self, id: str):
        with self._lock:
            self._jobs.pop(id, None)
