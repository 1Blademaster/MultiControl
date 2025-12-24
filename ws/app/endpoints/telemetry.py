import logging

from pymavlink.mavutil import mavlink

import app.shared_state as state
from app import socketio

logger = logging.getLogger("endpoints.telemetry")


def send_message(message: mavlink.MAVLink_message) -> None:
    if state.radio_link is not None:
        message_dict = message.to_dict()
        message_dict["system_id"] = message.get_srcSystem()

        socketio.emit("telemetry_message", {"success": True, "data": message_dict})


def setup_telemetry_listeners() -> bool:
    if state.radio_link is None:
        logger.warning(
            "Radio link is not initialized, can not setup telemetry listeners"
        )
        return False

    state.radio_link.add_message_listener("HEARTBEAT", send_message)
    state.radio_link.add_message_listener("VFR_HUD", send_message)
    state.radio_link.add_message_listener("GLOBAL_POSITION_INT", send_message)

    logger.info("Telemetry listeners have been set up successfully")

    return True
