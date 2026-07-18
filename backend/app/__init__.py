import asyncio
import logging
import os
import threading

from flask import Flask
from flask_cors import CORS

from .config import DOWNLOAD_DIR
from .engines import EngineRegistry
from .engines.aria2 import Aria2Engine
from .models import JobStore
from .poller import BackgroundPoller
from .routes import bp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

    registry = EngineRegistry()
    store = JobStore()

    registry.register(Aria2Engine())

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        loop.run_until_complete(registry.start_all())
        logger.info("Engines started: %s", registry.list())
    except Exception as e:
        logger.warning("Engine start failed (aria2c may not be installed): %s", e)

    _loop_thread = threading.Thread(target=loop.run_forever, daemon=True)
    _loop_thread.start()

    app.config["ENGINE_REGISTRY"] = registry
    app.config["JOB_STORE"] = store
    app.config["EVENT_LOOP"] = loop

    poller = BackgroundPoller(registry, store, loop)
    poller.start()
    app.config["POLLER"] = poller

    app.register_blueprint(bp)

    return app


if __name__ == "__main__":
    _app = create_app()
    port = int(os.environ.get("FLASK_RUN_PORT", 5000))
    host = os.environ.get("FLASK_RUN_HOST", "127.0.0.1")
    _app.run(host=host, port=port, debug=True)
