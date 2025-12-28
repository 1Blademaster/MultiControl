import logging

from pymavlink import mavutil
from pymavlink.mavutil import mavlink

from app.types import VehicleType


def get_flight_mode_string(flight_mode: int) -> str:
    return mavutil.mode_string_acm(flight_mode)


class Vehicle:
    def __init__(
        self,
        system_id: int,
        component_id: int,
        vehicle_type_int: int,
        vehicle_type: VehicleType,
    ):
        self.system_id: int = system_id
        self.component_id: int = component_id
        self.vehicle_type_int: int = vehicle_type_int
        self.vehicle_type: VehicleType = vehicle_type

        self.logger: logging.Logger = logging.getLogger(
            f"vehicle_{self.vehicle_type}_{self.system_id}"
        )

        self.armed: bool = False
        self.ground_speed: float = 0.0
        self.altitude: float = 0.0
        self.flight_mode: int = 0
        self.batt_volts: float = 0.0
        self.batt_curr: float = 0.0

        self.flight_mode_map = mavutil.mode_mapping_bynumber(self.vehicle_type_int)

    def handle_heartbeat(self, heartbeat: mavlink.MAVLink_heartbeat_message):
        self.armed = heartbeat.base_mode & mavlink.MAV_MODE_FLAG_SAFETY_ARMED != 0
        self.flight_mode = heartbeat.custom_mode

    def handle_vfr_hud(self, vfr_hud: mavlink.MAVLink_vfr_hud_message):
        self.ground_speed = vfr_hud.groundspeed
        self.altitude = vfr_hud.alt

    def serialize(self) -> dict:
        return {
            "system_id": self.system_id,
            "component_id": self.component_id,
            "vehicle_type": self.vehicle_type.value,
        }

    def __repr__(self):
        return (
            f"Vehicle({self.system_id}:{self.component_id}:{self.vehicle_type}, "
            f"armed={self.armed}, ground_speed={self.ground_speed}, altitude={self.altitude}, "
            f"flight_mode={get_flight_mode_string(self.flight_mode)})"
        )
