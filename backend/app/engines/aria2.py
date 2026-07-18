import asyncio
import logging
import subprocess
import uuid

import aiohttp

from ..config import (
    ARIA2_RPC_URL,
    ARIA2_RPC_PORT,
    DOWNLOAD_DIR,
    ARIA2_MAX_CONCURRENT,
    ARIA2_MAX_CONNECTION_PER_SERVER,
    ARIA2_SPLIT,
)
from . import DownloadEngine

logger = logging.getLogger(__name__)

ARIA2_STATUS_MAP = {
    "active": "downloading",
    "waiting": "pending",
    "paused": "paused",
    "complete": "completed",
    "error": "failed",
    "removed": "cancelled",
}


class Aria2Engine(DownloadEngine):
    def __init__(self):
        self._process: subprocess.Popen | None = None
        self._session: aiohttp.ClientSession | None = None
        self._rpc_url = ARIA2_RPC_URL

    @property
    def name(self) -> str:
        return "aria2"

    @property
    def session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session

    def normalize_status(self, raw: dict) -> dict:
        return {
            "status": ARIA2_STATUS_MAP.get(raw.get("status", ""), "pending"),
            "completedLength": int(raw.get("completedLength", "0")),
            "totalLength": int(raw.get("totalLength", "0")),
            "downloadSpeed": int(raw.get("downloadSpeed", "0")),
            "errorMessage": raw.get("errorMessage"),
        }

    async def _rpc(self, method: str, params: list | None = None) -> dict:
        payload = {
            "jsonrpc": "2.0",
            "id": str(uuid.uuid4()),
            "method": f"aria2.{method}",
            "params": params or [],
        }
        async with self.session.post(
            self._rpc_url, json=payload
        ) as resp:
            result = await resp.json()
            if "error" in result:
                raise RuntimeError(
                    f"aria2 RPC error ({result['error']['code']}): {result['error']['message']}"
                )
            return result["result"]

    async def _wait_for_ready(self, timeout: float = 10.0) -> bool:
        deadline = asyncio.get_event_loop().time() + timeout
        while asyncio.get_event_loop().time() < deadline:
            try:
                await self._rpc("getVersion")
                return True
            except (aiohttp.ClientError, OSError, RuntimeError):
                await asyncio.sleep(0.3)
        return False

    async def start(self) -> None:
        DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

        self._process = subprocess.Popen(
            [
                "aria2c",
                "--enable-rpc",
                "--rpc-listen-all=false",
                f"--rpc-listen-port={ARIA2_RPC_PORT}",
                f"--dir={DOWNLOAD_DIR}",
                "--continue=true",
                f"--max-concurrent-downloads={ARIA2_MAX_CONCURRENT}",
                f"--max-connection-per-server={ARIA2_MAX_CONNECTION_PER_SERVER}",
                f"--split={ARIA2_SPLIT}",
                "--console-log-level=error",
                "--allow-overwrite=true",
                "--auto-file-renaming=false",
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )

        ready = await self._wait_for_ready()
        if not ready:
            stderr = ""
            if self._process.stderr:
                stderr = self._process.stderr.read().decode(errors="replace")
            raise RuntimeError(
                f"aria2c failed to start on port {ARIA2_RPC_PORT}: {stderr}"
            )

        logger.info("aria2c ready on %s", self._rpc_url)

    async def stop(self) -> None:
        try:
            await self._rpc("shutdown")
        except Exception:
            pass

        if self._process:
            try:
                self._process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self._process.kill()
                self._process.wait()

        if self._session and not self._session.closed:
            await self._session.close()

    async def add(self, url: str, filename: str | None = None) -> str:
        params: list = [[url]]
        options = {}
        if filename:
            options["out"] = filename
        if options:
            params.append(options)
        else:
            params.append({})
        return await self._rpc("addUri", params)

    async def pause(self, engine_job_id: str) -> bool:
        try:
            await self._rpc("pause", [engine_job_id])
            return True
        except RuntimeError:
            return False

    async def resume(self, engine_job_id: str) -> bool:
        try:
            await self._rpc("unpause", [engine_job_id])
            return True
        except RuntimeError:
            return False

    async def cancel(self, engine_job_id: str) -> bool:
        try:
            await self._rpc("remove", [engine_job_id])
            return True
        except RuntimeError as e:
            if "not found" in str(e).lower():
                return True
            return False

    async def status(self, engine_job_id: str) -> dict:
        return await self._rpc("tellStatus", [engine_job_id])

    async def list_all(self) -> list[dict]:
        active = await self._rpc("tellActive")
        waiting = await self._rpc("tellWaiting", [0, 1000])
        stopped = await self._rpc("tellStopped", [0, 1000])
        return active + waiting + stopped


def map_aria2_status(aria2_status: str) -> str:
    return ARIA2_STATUS_MAP.get(aria2_status, "pending")


def extract_progress(aria_status: dict) -> float:
    total = aria_status.get("totalLength", 0)
    completed = aria_status.get("completedLength", 0)
    if isinstance(total, str):
        total = int(total)
    if isinstance(completed, str):
        completed = int(completed)
    if total > 0:
        return (completed / total) * 100
    return 0.0
