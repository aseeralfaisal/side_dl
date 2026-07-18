from abc import ABC, abstractmethod


class DownloadEngine(ABC):
    @property
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    async def start(self) -> None: ...

    @abstractmethod
    async def stop(self) -> None: ...

    @abstractmethod
    async def add(self, url: str, filename: str | None = None) -> str: ...

    @abstractmethod
    async def pause(self, engine_job_id: str) -> bool: ...

    @abstractmethod
    async def resume(self, engine_job_id: str) -> bool: ...

    @abstractmethod
    async def cancel(self, engine_job_id: str) -> bool: ...

    @abstractmethod
    async def status(self, engine_job_id: str) -> dict: ...

    @abstractmethod
    async def list_all(self) -> list[dict]: ...

    def normalize_status(self, raw: dict) -> dict:
        return {
            "status": raw.get("status", "pending"),
            "completedLength": int(raw.get("completedLength", 0)),
            "totalLength": int(raw.get("totalLength", 0)),
            "downloadSpeed": int(raw.get("downloadSpeed", 0)),
            "errorMessage": raw.get("errorMessage"),
        }


class EngineRegistry:
    def __init__(self):
        self._engines: dict[str, DownloadEngine] = {}

    def register(self, engine: DownloadEngine):
        self._engines[engine.name] = engine

    def get(self, name: str = "") -> DownloadEngine:
        if not name:
            name = next(iter(self._engines))
        return self._engines[name]

    def list(self) -> list[str]:
        return list(self._engines.keys())

    async def start_all(self):
        for e in self._engines.values():
            await e.start()

    async def stop_all(self):
        for e in self._engines.values():
            await e.stop()
