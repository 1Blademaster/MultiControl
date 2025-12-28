from enum import Enum
from typing import NotRequired

from typing_extensions import TypedDict


class Response(TypedDict):
    success: bool
    message: NotRequired[str]
    data: NotRequired[str]


class VehicleType(Enum):
    UNKNOWN = "unknown"
    COPTER = "copter"
    PLANE = "plane"
    ROVER = "rover"
    BOAT = "boat"
    TRACKER = "tracker"
    SUB = "sub"
    # BLIMP = "blimp"
