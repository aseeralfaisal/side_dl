import os

from . import create_app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("FLASK_RUN_PORT", 5000))
    host = os.environ.get("FLASK_RUN_HOST", "127.0.0.1")
    app.run(host=host, port=port, debug=True)
