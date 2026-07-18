"""Example custom download engine — use as a template for your own engine.

To add your engine to the app:
  1. Copy this file and implement all abstract methods.
  2. In backend/app/__init__.py, import and register it:
       from .engines.custom import CustomEngine
       registry.register(CustomEngine())
"""

from . import DownloadEngine


class CustomEngine(DownloadEngine):
    @property
    def name(self) -> str:
        return "custom"

    async def start(self) -> None:
        pass

    async def stop(self) -> None:
        pass

    async def add(self, url: str, filename: str | None = None) -> str:
        raise NotImplementedError

    async def pause(self, engine_job_id: str) -> bool:
        return False

    async def resume(self, engine_job_id: str) -> bool:
        return False

    async def cancel(self, engine_job_id: str) -> bool:
        return False

    async def status(self, engine_job_id: str) -> dict:
        raise NotImplementedError

    async def list_all(self) -> list[dict]:
        return []

    def normalize_status(self, raw: dict) -> dict:
        return {
            "status": raw.get("status", "pending"),
            "completedLength": int(raw.get("completedLength", 0)),
            "totalLength": int(raw.get("totalLength", 0)),
            "downloadSpeed": int(raw.get("downloadSpeed", 0)),
            "errorMessage": raw.get("errorMessage"),
        }
