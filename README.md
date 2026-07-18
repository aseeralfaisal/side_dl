# side_dl

<img width="1920" height="1280" alt="image" src="https://github.com/user-attachments/assets/ddcb13b9-b09c-464b-82cd-7230607326e9" />

A terminal-inspired desktop download manager built with **Tauri v2**, **React**, and a **Python Flask sidecar**.

## Features

- Keyboard-driven UI with Vim-style keybindings (`j/k` navigate, `p` pause, `r` resume, etc.)
- Tab filtering: All / Downloading / Paused / Queued / Completed
- Real-time progress bars, speed, and ETA for active downloads
- Concurrent download queue management
- Pause/Resume via HTTP Range requests
- Custom window chrome (no OS decorations) with resize handles
- Dark terminal theme with JetBrains Mono font

## Architecture

```
┌─────────────────────────────┐
│  Tauri Desktop Shell (Rust) │  ← manages sidecar lifecycle
│  ┌───────────────────────┐  │
│  │  React Frontend (Vite)│  │  ← terminal-inspired UI
│  │  └─────┬──────────────│  │
│  └────────│──────────────┘  │
└───────────│─────────────────┘
            │ HTTP (127.0.0.1:5000)
┌───────────▼─────────────────┐
│  Flask Sidecar (Python)     │  ← download engine (aiohttp)
│  - Job management           │
│  - Chunked streaming        │
│  - .part files → rename     │
│  - Range request resume     │
└─────────────────────────────┘
```

- Flask runs as a local sidecar (bound to `127.0.0.1` only), started/stopped by Tauri.
- Frontend communicates with Flask over plain HTTP (`fetch`).
- Downloads are streamed in 64 KB chunks via `aiohttp` — never loaded fully into memory.
- Active downloads use `.part` files; renamed on completion.
- Resume uses HTTP `Range` headers from the existing `.part` file size.

## Prerequisites

- **Rust** (with `cargo`) — for Tauri
- **Node.js** + **pnpm** — for the frontend
- **Python 3** + `pip` — for the Flask backend
- Tauri system dependencies (e.g., `webkit2gtk` on Linux)

## Getting Started

```bash
# Install backend dependencies
pip install -r backend/requirements.txt

# Install frontend dependencies
cd frontend && pnpm install

# Run in development mode (starts Vite + Tauri window)
cd ../src-tauri && cargo tauri dev
```

### Development only (no Tauri window)

```bash
# Frontend only
pnpm --dir frontend dev

# Backend only
python3 backend/app/__init__.py
```

### Lint

```bash
pnpm --dir frontend lint
```

### Build for production

```bash
cd src-tauri && cargo tauri build
```

## Project Structure

```
├── frontend/          # React + TypeScript + Vite UI
│   ├── src/
│   │   ├── api/       # HTTP client (fetch → Flask)
│   │   ├── components/ # UI components (DownloadList, Modal, StatusBar, etc.)
│   │   ├── hooks/     # useDownloads, useVimKeybindings, useEscapeKey
│   │   └── utils/     # formatBytes, formatSpeed, SVG icons
│   └── ...
├── backend/           # Python Flask + aiohttp sidecar
│   ├── app/
│   │   ├── api/       # Flask routes (planned)
│   │   └── downloader/ # Core download engine (async_downloader, etc.)
│   └── tests/         # Backend tests (placeholder)
├── src-tauri/         # Tauri desktop shell (Rust)
│   ├── src/
│   │   ├── main.rs    # Entry point
│   │   └── lib.rs     # App setup + Flask sidecar lifecycle
│   └── tauri.conf.json
└── scripts/           # Utility scripts (placeholder)
```

## Status

The **frontend UI is fully built** (currently using mock data). The **backend download engine** (`backend/app/downloader/main.py`) is implemented, but Flask routes and job management are not yet wired. See [AGENTS.md](./AGENTS.md) for detailed constraints and planned API endpoints.
