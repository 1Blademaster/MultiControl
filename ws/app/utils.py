import logging
from typing import Any

from pymavlink.mavutil import mavlink

from app.types import VehicleType


def command_accepted(response: Any, command: int, logger: logging.Logger) -> bool:
    if command is None:
        logger.warning("Command is None, cannot check if command accepted")
        return False

    if response is None:
        logger.warning(f"Response is None, cannot check if command {command} accepted")
        return False

    if response.command != command:
        logger.warning(
            f"Command {command} does not match response command {response.command}"
        )
        logger.debug(f"Full response: {response.to_dict()}, command: {command}")
        return False

    if response.result != mavlink.MAV_RESULT_ACCEPTED:
        logger.warning(f"Command {command} not accepted, result: {response.result}")
        return False

    return True


def get_vehicle_type_from_heartbeat(
    heartbeat_message: mavlink.MAVLink_heartbeat_message,
) -> VehicleType:
    mav_type = heartbeat_message.type
    if mav_type in [
        mavlink.MAV_TYPE_HELICOPTER,
        mavlink.MAV_TYPE_TRICOPTER,
        mavlink.MAV_TYPE_QUADROTOR,
        mavlink.MAV_TYPE_HEXAROTOR,
        mavlink.MAV_TYPE_OCTOROTOR,
        mavlink.MAV_TYPE_DECAROTOR,
        mavlink.MAV_TYPE_DODECAROTOR,
        mavlink.MAV_TYPE_COAXIAL,
    ]:
        return VehicleType.COPTER
    elif mav_type in [
        mavlink.MAV_TYPE_FIXED_WING,
        mavlink.MAV_TYPE_VTOL_TILTROTOR,
    ]:
        return VehicleType.PLANE
    elif mav_type in [
        mavlink.MAV_TYPE_GROUND_ROVER,
    ]:
        return VehicleType.ROVER
    elif mav_type in [
        mavlink.MAV_TYPE_SURFACE_BOAT,
    ]:
        return VehicleType.BOAT
    elif mav_type in [
        mavlink.MAV_TYPE_ANTENNA_TRACKER,
    ]:
        return VehicleType.TRACKER
    elif mav_type in [
        mavlink.MAV_TYPE_SUBMARINE,
    ]:
        return VehicleType.SUB
    # elif mav_type in [
    #     mavlink.MAV_TYPE_AIRSHIP,
    # ]:
    #     return VehicleType.BLIMP

    return VehicleType.UNKNOWN
