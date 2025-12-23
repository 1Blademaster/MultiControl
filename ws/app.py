import logging
import os

from app.endpoints import endpoints
from app.shared_state import radio_link
from flask import Flask
from flask_socketio import SocketIO

os.environ["MAVLINK20"] = "1"

PORT = 4237
HOST = "127.0.0.1"

logging.basicConfig(level=logging.DEBUG)

logger = logging.getLogger("multicontrol")
logger.setLevel(logging.DEBUG)
flask_logger = logging.getLogger("werkzeug")
flask_logger.setLevel(logging.INFO)

socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")

if __name__ == "__main__":
    logger.info("Initialising app")
    app = Flask(__name__)
    app.debug = True
    app.config["SECRET_KEY"] = "secret-key"

    app.register_blueprint(endpoints)

    socketio.init_app(app)

    socketio.run(app, allow_unsafe_werkzeug=True, host=HOST, port=PORT)
    if radio_link is not None:
        radio_link.close()
