import logging
from typing import Any

from pymavlink.mavutil import mavlink


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
