import asyncio
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse

from flask import Blueprint, current_app, jsonify, request

from .models import DownloadJob

bp = Blueprint("downloads", __name__)


def _registry():
    return current_app.config["ENGINE_REGISTRY"]


def _store():
    return current_app.config["JOB_STORE"]


def _run_async(coro):
    loop = current_app.config["EVENT_LOOP"]
    future = asyncio.run_coroutine_threadsafe(coro, loop)
    return future.result(timeout=30)


@bp.route("/downloads", methods=["POST"])
def create_download():
    data = request.get_json()
    if not data or "url" not in data:
        return jsonify({"error": "url is required"}), 400

    url = data["url"].strip()
    if not url:
        return jsonify({"error": "url is required"}), 400

    filename = data.get("filename", "").strip() or None
    if not filename:
        parsed = urlparse(url)
        path = parsed.path.rstrip("/")
        filename = path.split("/")[-1] if path and "/" in parsed.path else None
    engine = _registry().get()

    try:
        engine_job_id = _run_async(engine.add(url, filename))
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 502
    except Exception as e:
        return jsonify({"error": f"engine error: {e}"}), 502

    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    job = DownloadJob(
        id=job_id,
        url=url,
        filename=filename or engine_job_id,
        engine=engine.name,
        engine_job_id=engine_job_id,
        status="pending",
        created_at=now,
        updated_at=now,
    )
    _store().put(job)
    return jsonify(job.to_dict()), 201


@bp.route("/downloads", methods=["GET"])
def list_downloads():
    return jsonify([j.to_dict() for j in _store().list()])


@bp.route("/downloads/<job_id>", methods=["GET"])
def get_download(job_id: str):
    job = _store().get(job_id)
    if not job:
        return jsonify({"error": "not found"}), 404
    return jsonify(job.to_dict())


@bp.route("/downloads/<job_id>/pause", methods=["POST"])
def pause_download(job_id: str):
    store = _store()
    job = store.get(job_id)
    if not job:
        return jsonify({"error": "not found"}), 404

    engine = _registry().get()
    ok = _run_async(engine.pause(job.engine_job_id))
    if not ok:
        return jsonify({"error": "failed to pause"}), 502

    job.status = "paused"
    job.speed = 0
    job.updated_at = datetime.now(timezone.utc).isoformat()
    store.put(job)
    return jsonify(job.to_dict())


@bp.route("/downloads/<job_id>/resume", methods=["POST"])
def resume_download(job_id: str):
    store = _store()
    job = store.get(job_id)
    if not job:
        return jsonify({"error": "not found"}), 404

    engine = _registry().get()
    ok = _run_async(engine.resume(job.engine_job_id))
    if not ok:
        return jsonify({"error": "failed to resume"}), 502

    job.status = "downloading"
    job.updated_at = datetime.now(timezone.utc).isoformat()
    store.put(job)
    return jsonify(job.to_dict())


@bp.route("/downloads/<job_id>/cancel", methods=["POST"])
def cancel_download(job_id: str):
    store = _store()
    job = store.get(job_id)
    if not job:
        return jsonify({"error": "not found"}), 404

    engine = _registry().get()
    ok = _run_async(engine.cancel(job.engine_job_id))
    if not ok:
        return jsonify({"error": "failed to cancel"}), 502

    job.status = "cancelled"
    job.speed = 0
    job.updated_at = datetime.now(timezone.utc).isoformat()
    store.put(job)
    return jsonify(job.to_dict())
