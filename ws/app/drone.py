import logging

from pymavlink import mavutil
from pymavlink.mavutil import mavlink


def get_flight_mode_string(flight_mode: int) -> str:
    return mavutil.mode_string_acm(flight_mode)


class Drone:
    def __init__(self, src_system: int, src_component: int):
        self.src_system: int = src_system
        self.src_component: int = src_component

        self.logger: logging.Logger = logging.getLogger(
            f"drone_{self.src_system}_{self.src_component}"
        )

        self.armed: bool = False
        self.ground_speed: float = 0.0
        self.altitude: float = 0.0
        self.flight_mode: int = 0
        self.batt_volts: float = 0.0
        self.batt_curr: float = 0.0

    def handle_heartbeat(self, heartbeat: mavlink.MAVLink_heartbeat_message):
        self.armed = heartbeat.base_mode & mavlink.MAV_MODE_FLAG_SAFETY_ARMED != 0
        self.flight_mode = heartbeat.custom_mode

    def handle_vfr_hud(self, vfr_hud: mavlink.MAVLink_vfr_hud_message):
        self.ground_speed = vfr_hud.groundspeed
        self.altitude = vfr_hud.alt

    def serialize(self) -> dict:
        return {
            "system_id": self.src_system,
            "component_id": self.src_component,
        }

    def __repr__(self):
        return (
            f"Drone({self.src_system}:{self.src_component}, "
            f"armed={self.armed}, ground_speed={self.ground_speed}, altitude={self.altitude}, "
            f"flight_mode={get_flight_mode_string(self.flight_mode)})"
        )
