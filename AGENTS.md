# AGENTS.md

## Project

This is a Tauri + React desktop download manager with a local Python Flask sidecar backend.

## Architecture

- React UI source lives in `frontend/` and runs inside the Tauri desktop app.
- Flask runs locally as a sidecar process.
- Flask must bind to `127.0.0.1`, not `0.0.0.0`.
- The Flask backend is not deployed remotely.
- Tauri starts the Flask sidecar when the app opens and stops it when the app exits.
- The Flask backend manages download jobs and streams files with `aiohttp`.

## Planned API

- `POST /downloads`: start a download.
- `GET /downloads`: list download jobs.
- `GET /downloads/<id>`: get one download job.
- `POST /downloads/<id>/pause`: pause a download.
- `POST /downloads/<id>/resume`: resume a paused download.
- `POST /downloads/<id>/cancel`: cancel a download.

## Download Rules

- Never load full files into memory.
- Stream downloads in chunks with `aiohttp`.
- Write active downloads to `.part` files first.
- Rename `.part` files only after completion.
- Pause means stop the active request and keep the `.part` file.
- Resume must use HTTP Range requests from the existing `.part` size.
- If Range resume is unsupported, fail clearly instead of corrupting or restarting silently.

## Agent Constraints

- Do not replace Flask with FastAPI unless explicitly asked.
- Do not deploy the backend remotely unless explicitly asked.
- Do not rewrite the downloader in Rust unless explicitly asked.
- Do not bind Flask to `0.0.0.0`.
- Keep changes scoped to the requested task.
