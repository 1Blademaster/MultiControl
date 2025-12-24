import logging

from pymavlink import mavutil
from typing_extensions import TypedDict

import app.shared_state as state
from app import socketio
from app.radio_link import RadioLink

logger = logging.getLogger("endpoint.connection")


class ConnectionSettings(TypedDict):
    connectionType: str
    port: str
    baud: int


@socketio.on("connect")
def connect() -> None:
    logger.debug("Client connected!")


@socketio.on("disconnect")
def disconnect() -> None:
    if state.radio_link:
        state.radio_link.close()
    state.radio_link = None
    logger.debug("Client disconnected!")


@socketio.on("get_com_ports")
def get_com_ports() -> None:
    com_ports = mavutil.auto_detect_serial(
        preferred_list=["*ArduPilot*", "*MAVLink*", "*mavlink*", "*Cube*"]
    )
    socketio.emit(
        "get_com_ports_result",
        {"success": True, "data": [port.device for port in com_ports]},
    )


@socketio.on("is_connected_to_radio_link")
def is_connected_to_radio_link() -> None:
    socketio.emit(
        "is_connected_to_radio_link_result",
        {"success": True, "data": bool(state.radio_link)},
    )


def send_connection_error(message: str) -> None:
    socketio.emit(
        "connect_to_radio_link_result", {"success": False, "message": message}
    )


def initial_heartbeat_update(
    message: dict,
) -> None:
    socketio.emit("initial_heartbeat_update", message)


@socketio.on("connect_to_radio_link")
def connect_to_radio_link(connection_settings: ConnectionSettings) -> None:
    if state.radio_link:
        logger.warning("Already connected to a radio link")
        return

    connection_type = connection_settings.get("connectionType")

    if connection_type == "serial":
        port = connection_settings.get("port")
        if not port:
            send_connection_error("Port not specified")
            return

        baud = connection_settings.get("baud", None)
        if baud is None:
            send_connection_error("Baud not specified")
            return
    elif connection_type == "network":
        port = connection_settings.get("port")
        if not port:
            send_connection_error("Address not specified")
            return
        baud = 115200
    else:
        logger.error(f"Unknown connection type, got {connection_type}")
        send_connection_error("Unknown connection type")
        return

    radio_link = RadioLink(port, baud, initial_heartbeat_update)
    if radio_link.master is None:
        # TODO: Add proper error handling and messages
        send_connection_error("Failed to connect to radio link")
        return

    state.radio_link = radio_link
    drones_connected_to = radio_link.get_drones()
    socketio.emit(
        "connect_to_radio_link_result",
        {
            "success": True,
            "message": f"Connected to {len(drones_connected_to)} drones via radio link",
            "data": {"drones": drones_connected_to},
        },
    )


@socketio.on("disconnect_from_radio_link")
def disconnect_from_radio_link() -> None:
    if state.radio_link:
        state.radio_link.close()
    state.radio_link = None
    socketio.emit(
        "disconnect_from_radio_link_result",
        {"success": True, "message": "Disconnected from radio link"},
    )
