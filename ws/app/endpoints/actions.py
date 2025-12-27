import logging

from typing_extensions import TypedDict

import app.shared_state as state
from app import socketio

logger = logging.getLogger("endpoint.actions")


class ArmSettings(TypedDict):
    system_id: int
    force: bool


@socketio.on("arm_vehicle")
def connect_to_radio_link(arm_settings: ArmSettings) -> None:
    if state.radio_link is None:
        logger.warning("Not connected to radio link, cannot arm vehicle")
        return

    system_id = arm_settings.get("system_id")
    if system_id is None:
        socketio.emit(
            "arm_vehicle_result",
            {
                "success": False,
                "message": "No system ID specified while trying to arm a vehicle",
            },
        )
        return

    force = arm_settings.get("force", False)

    arm_result = state.radio_link.arm_vehicle(system_id, force)

    socketio.emit("arm_vehicle_result", arm_result)
