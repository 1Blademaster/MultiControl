import logging

from typing_extensions import TypedDict

import app.shared_state as state
from app import socketio

logger = logging.getLogger("endpoint.actions")


class ArmDisarmSettings(TypedDict):
    system_id: int
    force: bool


class ArmDisarmAllVehiclesSettings(TypedDict):
    force: bool


class SetFlightModeSettings(TypedDict):
    system_id: int
    flight_mode: int


class SetFlightModeAllVehiclesSettings(TypedDict):
    flight_mode: str


class CopterTakeoffSettings(TypedDict):
    system_id: int
    altitude: float


@socketio.on("arm_vehicle")
def arm_vehicle(arm_settings: ArmDisarmSettings) -> None:
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


@socketio.on("arm_all_vehicles")
def arm_all_vehicles(arm_settings: ArmDisarmAllVehiclesSettings) -> None:
    if state.radio_link is None:
        logger.warning("Not connected to radio link, cannot arm vehicles")
        return

    force = arm_settings.get("force", False)

    arm_result = state.radio_link.arm_all_vehicles(force)

    socketio.emit("arm_all_vehicles_result", arm_result)


@socketio.on("disarm_vehicle")
def disarm_vehicle(disarm_settings: ArmDisarmSettings) -> None:
    if state.radio_link is None:
        logger.warning("Not connected to radio link, cannot disarm vehicle")
        return

    system_id = disarm_settings.get("system_id")
    if system_id is None:
        socketio.emit(
            "disarm_vehicle_result",
            {
                "success": False,
                "message": "No system ID specified while trying to disarm a vehicle",
            },
        )
        return

    force = disarm_settings.get("force", False)

    disarm_result = state.radio_link.disarm_vehicle(system_id, force)

    socketio.emit("disarm_vehicle_result", disarm_result)


@socketio.on("disarm_all_vehicles")
def disarm_all_vehicles(disarm_settings: ArmDisarmAllVehiclesSettings) -> None:
    if state.radio_link is None:
        logger.warning("Not connected to radio link, cannot disarm vehicles")
        return

    force = disarm_settings.get("force", False)

    disarm_result = state.radio_link.disarm_all_vehicles(force)

    socketio.emit("disarm_all_vehicles_result", disarm_result)


@socketio.on("set_vehicle_flight_mode")
def set_vehicle_flight_mode(flight_mode_settings: SetFlightModeSettings) -> None:
    if state.radio_link is None:
        logger.warning("Not connected to radio link, cannot set vehicle flight mode")
        return

    system_id = flight_mode_settings.get("system_id")
    if system_id is None:
        socketio.emit(
            "set_vehicle_flight_mode_result",
            {
                "success": False,
                "message": "No system ID specified while trying to set vehicle flight mode",
            },
        )
        return

    flight_mode = flight_mode_settings.get("flight_mode", None)
    if flight_mode is None:
        socketio.emit(
            "set_vehicle_flight_mode_result",
            {
                "success": False,
                "message": "No flight mode specified while trying to set vehicle flight mode",
            },
        )
        return

    try:
        flight_mode = int(flight_mode)
    except ValueError:
        socketio.emit(
            "set_vehicle_flight_mode_result",
            {
                "success": False,
                "message": "Invalid flight mode specified while trying to set vehicle flight mode",
            },
        )
        return

    set_flight_mode_result = state.radio_link.set_vehicle_flight_mode(
        system_id, flight_mode
    )

    socketio.emit("set_vehicle_flight_mode_result", set_flight_mode_result)


@socketio.on("set_all_vehicles_flight_mode")
def set_all_vehicles_flight_mode(
    flight_mode_settings: SetFlightModeAllVehiclesSettings,
) -> None:
    if state.radio_link is None:
        logger.warning(
            "Not connected to radio link, cannot set all vehicles flight mode"
        )
        return

    flight_mode = flight_mode_settings.get("flight_mode", None)
    if flight_mode is None:
        socketio.emit(
            "set_all_vehicles_flight_mode_result",
            {
                "success": False,
                "message": "No flight mode specified while trying to set all vehicles flight mode",
            },
        )
        return

    set_flight_mode_result = state.radio_link.set_all_vehicles_flight_mode(flight_mode)

    socketio.emit("set_all_vehicles_flight_mode_result", set_flight_mode_result)


@socketio.on("copter_takeoff")
def copter_takeoff(takeoff_settings: CopterTakeoffSettings) -> None:
    if state.radio_link is None:
        logger.warning("Not connected to radio link, cannot takeoff copter")
        return

    system_id = takeoff_settings.get("system_id")
    if system_id is None:
        socketio.emit(
            "copter_takeoff_result",
            {
                "success": False,
                "message": "No system ID specified while trying to takeoff copter",
            },
        )
        return

    altitude = takeoff_settings.get("altitude")
    if altitude is None:
        socketio.emit(
            "copter_takeoff_result",
            {
                "success": False,
                "message": "No altitude specified while trying to takeoff copter",
            },
        )
        return

    try:
        altitude = float(altitude)
    except ValueError:
        socketio.emit(
            "copter_takeoff_result",
            {
                "success": False,
                "message": "Invalid altitude specified while trying to takeoff copter",
            },
        )
        return

    takeoff_result = state.radio_link.copter_takeoff(system_id, altitude)

    socketio.emit("copter_takeoff_result", takeoff_result)
