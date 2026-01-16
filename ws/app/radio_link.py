import logging
import threading
import time
import traceback
from queue import Empty, Queue
from typing import Callable, Dict, Optional, Set

import serial
from pymavlink import mavutil
from pymavlink.mavutil import mavlink

from app.types import Response, VehicleType
from app.utils import command_accepted, get_vehicle_type_from_heartbeat
from app.vehicle import Vehicle


class RadioLink:
    def __init__(
        self,
        port: str,
        baud: int = 57600,
        initial_heartbeat_update_callback: Optional[Callable] = None,
    ):
        self.logger = logging.getLogger("radio_link")

        self.port = port
        self.baud = baud
        self.initial_heartbeat_update_callback = initial_heartbeat_update_callback

        self.logger.info(f"Initialising radio link on {self.port}:{self.baud}")

        self.master: Optional[mavutil.mavserial] = None
        try:
            self.master = mavutil.mavlink_connection(
                self.port,
                baud=self.baud,
                source_system=255,
                source_component=mavlink.MAV_COMP_ID_MISSIONPLANNER,
            )
        except Exception:
            self.logger.exception(traceback.format_exc())
            if self.master:
                self.master.close()
            self.master = None
            return

        self.vehicles: Dict = {}

        if not self._listen_for_initial_heartbeats(5):
            self.logger.error("Failed to establish initial heartbeat")
            if self.master:
                self.master.close()
            self.master = None
            return

        self.message_listeners: Dict[str, Callable] = {}
        self.message_queue: Queue = Queue()

        self.sending_command_lock: threading.Lock = threading.Lock()
        self.sending_command_queue: Queue = Queue()

        self.reserved_messages: Set[str] = set()
        self.controller_queues: Dict[str, Queue] = {}
        self.reservation_lock = threading.Lock()
        self.controller_id = f"radio_link_{threading.current_thread().ident}"

        self.is_active: threading.Event = threading.Event()
        self.is_active.set()

        self.handle_incoming_messages_thread = threading.Thread(
            target=self._handle_incoming_messages, daemon=True
        )
        self.send_heartbeats_out_thread = threading.Thread(
            target=self._send_heartbeats_out, daemon=True
        )
        self.execute_message_listeners_thread = threading.Thread(
            target=self._execute_message_listeners, daemon=True
        )
        self._start_threads()

    def _listen_for_initial_heartbeats(self, timeout: int) -> bool:
        self.logger.info(f"Listening for initial heartbeats for {timeout} seconds")
        start_time = time.time()
        time_since_last_update = time.time()
        seconds_waited = 1
        while True:
            if time.time() - start_time > timeout or self.master is None:
                break

            heartbeat = self.master.recv_match(
                type="HEARTBEAT", blocking=True, timeout=0.2
            )
            if heartbeat is None:
                continue

            vehicle_type = get_vehicle_type_from_heartbeat(heartbeat)
            if vehicle_type == VehicleType.UNKNOWN:
                self.logger.warning(f"Unknown vehicle type for heartbeat: {heartbeat}")
                continue

            system_id = heartbeat.get_srcSystem()

            if system_id not in self.vehicles:
                component_id = heartbeat.get_srcComponent()
                if component_id != mavlink.MAV_COMP_ID_AUTOPILOT1:
                    self.logger.warning(
                        f"Unexpected component_id for heartbeat: {component_id}"
                    )
                    continue

                self.vehicles[system_id] = Vehicle(
                    system_id, component_id, heartbeat.type, vehicle_type
                )
                self.logger.info(f"New vehicle added: {system_id}")
                if self.initial_heartbeat_update_callback:
                    self.initial_heartbeat_update_callback(
                        {
                            "success": True,
                            "message": f"Heartbeat received from {vehicle_type.value}: {system_id}:{component_id}",
                        }
                    )

            # Send heartbeat update every 1 second
            if (
                time.time() - time_since_last_update > 1
                and self.initial_heartbeat_update_callback
            ):
                seconds_waited += 1
                self.initial_heartbeat_update_callback(
                    {"success": True, "data": seconds_waited}
                )
                time_since_last_update = time.time()

        if not self.vehicles:
            return False
        return True

    def _start_threads(self) -> None:
        self.handle_incoming_messages_thread.start()
        self.send_heartbeats_out_thread.start()
        self.execute_message_listeners_thread.start()

    def add_message_listener(self, message_id: str, callback: Callable) -> bool:
        if message_id not in self.message_listeners:
            self.message_listeners[message_id] = callback
            return True
        return False

    def remove_message_listener(self, message_id: str) -> bool:
        if message_id in self.message_listeners:
            del self.message_listeners[message_id]
            return True
        return False

    def clear_message_listeners(self) -> None:
        if getattr(self, "message_listeners", None):
            self.message_listeners.clear()

    def _handle_incoming_messages(self) -> None:
        while self.is_active.is_set() and self.master is not None:
            try:
                msg = self.master.recv_match(blocking=True)
            except KeyboardInterrupt:
                break
            except (serial.serialutil.SerialException, ConnectionAbortedError):
                self.logger.error("Radio link disconnected", exc_info=True)
                break
            except Exception:
                self.logger.exception(traceback.format_exc())
                continue

            if msg is None:
                continue

            msg_src_system = msg.get_srcSystem()
            # msg_src_component = msg.get_srcComponent()

            if msg_src_system not in self.vehicles:
                continue

            vehicle = self.vehicles[msg_src_system]

            msg_name = msg.get_type()

            if msg_name == "TIMESYNC":
                component_timestamp = msg.ts1
                local_timestamp = time.time_ns()
                self.master.mav.timesync_send(local_timestamp, component_timestamp)
                continue
            elif msg_name == "STATUSTEXT":
                self.logger.info(f"{msg_src_system}: {msg.text}")
            elif msg_name == "HEARTBEAT":
                vehicle.handle_heartbeat(msg)
            elif msg_name == "VFR_HUD":
                vehicle.handle_vfr_hud(msg)

            with self.reservation_lock:
                if msg_name in self.reserved_messages:
                    # Route to controller queues
                    for controller_id, queue in self.controller_queues.items():
                        try:
                            queue.put((msg_name, msg), block=False)
                        except Exception:
                            # Queue full
                            pass
                else:
                    # Route to normal message listeners
                    if msg_name in self.message_listeners:
                        self.message_queue.put([msg_name, msg])

    def _send_heartbeats_out(self) -> None:
        while self.is_active.is_set() and self.master is not None:
            try:
                self.master.mav.heartbeat_send(
                    mavutil.mavlink.MAV_TYPE_GCS,
                    mavutil.mavlink.MAV_AUTOPILOT_INVALID,
                    0,
                    0,
                    mavutil.mavlink.MAV_STATE_ACTIVE,
                )
            except Exception as e:
                self.logger.error(f"Failed to send heartbeat: {e}", exc_info=True)
            time.sleep(1)

    def _execute_message_listeners(self) -> None:
        while self.is_active.is_set():
            try:
                q = self.message_queue.get(timeout=1)
                self.message_listeners[q[0]](q[1])
            except Empty:
                continue
            except KeyError as e:
                self.logger.error(f"Could not execute message listener: {e}")

    def _stop_all_threads(self) -> None:
        this_thread = threading.current_thread()

        for thread in [
            getattr(self, "handle_incoming_messages_thread", None),
            getattr(self, "send_heartbeats_out_thread", None),
            getattr(self, "execute_message_listeners_thread", None),
        ]:
            if thread is not None and thread.is_alive() and thread is not this_thread:
                thread.join(timeout=3)

    def reserve_message_type(self, message_id: str, controller_id: str) -> bool:
        with self.reservation_lock:
            if message_id in self.reserved_messages:
                return False

            self.reserved_messages.add(message_id)
            if controller_id not in self.controller_queues:
                self.controller_queues[controller_id] = Queue()

            return True

    def release_message_type(self, message_id: str, controller_id: str) -> None:
        with self.reservation_lock:
            self.reserved_messages.discard(message_id)

            # Clear any remaining messages in the controllers queue for this type,
            # easiest way is just to create a new, empty queue
            if controller_id in self.controller_queues:
                self.controller_queues[controller_id] = Queue()

    def wait_for_message(
        self,
        message_id: str,
        controller_id: str,
        timeout: float = 3.0,
        conditional_func=None,
    ) -> Optional[mavlink.MAVLink_message]:
        if controller_id not in self.controller_queues:
            self.controller_queues[controller_id] = Queue()

        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                # Check controller's queue for the message
                queue_item = self.controller_queues[controller_id].get(timeout=0.1)
                msg_type, msg = queue_item

                if msg_type == message_id:
                    # Apply condition filter if provided
                    if conditional_func is None or conditional_func(msg):
                        return msg
                    else:
                        # Not the message we're looking for, continue waiting
                        continue

            except Empty:
                continue

        self.logger.debug(
            f"Timeout waiting for message {message_id} for controller {controller_id}"
        )
        return None

    def get_vehicles(self) -> list:
        return [vehicle.serialize() for vehicle in self.vehicles.values()]

    def send_command_to_vehicle(
        self,
        system_id: int,
        message: int,
        param1: float = 0,
        param2: float = 0,
        param3: float = 0,
        param4: float = 0,
        param5: float = 0,
        param6: float = 0,
        param7: float = 0,
    ) -> None:
        if self.master is None:
            return

        message = self.master.mav.command_long_encode(
            system_id,
            mavlink.MAV_COMP_ID_AUTOPILOT1,
            message,
            0,  # Confirmation
            param1,
            param2,
            param3,
            param4,
            param5,
            param6,
            param7,
        )
        self.master.mav.send(message)

    def arm_vehicle(self, system_id: int, force: bool = False) -> Response:
        if not self.reserve_message_type("COMMAND_ACK", self.controller_id):
            return {
                "success": False,
                "message": "Could not reserve COMMAND_ACK messages",
            }

        try:
            target_vehicle = self.vehicles[system_id]

            if target_vehicle is None:
                return {
                    "success": False,
                    "message": "Vehicle not found",
                }

            self.send_command_to_vehicle(
                system_id,
                mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
                param1=1,  # 0=disarm, 1=arm
                param2=21196 if force else 0,  # force arm/disarm
            )

            response = self.wait_for_message(
                "COMMAND_ACK",
                self.controller_id,
                conditional_func=lambda msg: (msg.get_srcSystem() == system_id)
                and (msg.command == mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM),
            )

            if command_accepted(
                response, mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM, self.logger
            ):
                # Wait for the vehicle to be armed fully after the command has been accepted
                self.logger.debug(f"[{system_id}] Waiting for arm")
                while not self.vehicles[system_id].armed:
                    time.sleep(0.05)
                self.logger.debug(f"[{system_id}] ARMED")
                return {"success": True, "message": "Armed successfully"}
            else:
                self.logger.debug(f"[{system_id}] Arming failed")
                return {
                    "success": False,
                    "message": "Could not arm, command not accepted",
                }

        except Exception as e:
            self.logger.error(e, exc_info=True)
            return {"success": False, "message": "Could not arm, serial exception"}
        finally:
            self.release_message_type("COMMAND_ACK", self.controller_id)

    def arm_all_vehicles(self, force: bool = False) -> Response:
        failed_vehicles = []

        try:
            for system_id in self.vehicles.keys():
                response = self.arm_vehicle(system_id, force)
                if not response["success"]:
                    failed_vehicles.append(system_id)

            if not failed_vehicles:
                return {
                    "success": True,
                    "message": "Armed all vehicles successfully",
                }
            else:
                return {
                    "success": False,
                    "message": f"Could not arm {len(failed_vehicles)} vehicles",
                }
        except Exception as e:
            self.logger.error(e, exc_info=True)
            return {
                "success": False,
                "message": f"Could not arm all vehicles, {e}",
            }

    def disarm_vehicle(self, system_id: int, force: bool = False) -> Response:
        if not self.reserve_message_type("COMMAND_ACK", self.controller_id):
            return {
                "success": False,
                "message": "Could not reserve COMMAND_ACK messages",
            }

        try:
            target_vehicle = self.vehicles[system_id]

            if target_vehicle is None:
                return {
                    "success": False,
                    "message": "Vehicle not found",
                }

            self.send_command_to_vehicle(
                system_id,
                mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
                param1=0,  # 0=disarm, 1=arm
                param2=21196 if force else 0,  # force arm/disarm
            )

            response = self.wait_for_message(
                "COMMAND_ACK",
                self.controller_id,
                conditional_func=lambda msg: (msg.get_srcSystem() == system_id)
                and (msg.command == mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM),
            )

            if command_accepted(
                response, mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM, self.logger
            ):
                # Wait for the vehicle to be disarmed fully after the command has been accepted
                self.logger.debug(f"[{system_id}] Waiting for disarm")
                while self.vehicles[system_id].armed:
                    time.sleep(0.05)
                self.logger.debug(f"[{system_id}] DISARMED")
                return {"success": True, "message": "Disarmed successfully"}
            else:
                self.logger.debug(f"[{system_id}] Disarming failed")
                return {
                    "success": False,
                    "message": "Could not disarm, command not accepted",
                }

        except Exception as e:
            self.logger.error(e, exc_info=True)
            return {"success": False, "message": "Could not disarm, serial exception"}
        finally:
            self.release_message_type("COMMAND_ACK", self.controller_id)

    def disarm_all_vehicles(self, force: bool = False) -> Response:
        failed_vehicles = []

        try:
            for system_id in self.vehicles.keys():
                response = self.disarm_vehicle(system_id, force)
                if not response["success"]:
                    failed_vehicles.append(system_id)

            if not failed_vehicles:
                return {
                    "success": True,
                    "message": "Disarmed all vehicles successfully",
                }
            else:
                return {
                    "success": False,
                    "message": f"Could not disarm {len(failed_vehicles)} vehicles",
                }
        except Exception as e:
            self.logger.error(e, exc_info=True)
            return {
                "success": False,
                "message": f"Could not disarm all vehicles, {e}",
            }

    def copter_takeoff(self, system_id: int, altitude: float) -> Response:
        try:
            target_vehicle = self.vehicles[system_id]

            if target_vehicle is None:
                return {
                    "success": False,
                    "message": "Vehicle not found",
                }

            # Ensure vehicle is Copter
            if target_vehicle.vehicle_type != VehicleType.COPTER:
                return {
                    "success": False,
                    "message": "Vehicle is not a copter",
                }

            # Set GUIDED mode
            set_guided_mode_res = self.set_vehicle_flight_mode(
                system_id, mavutil.mavlink.COPTER_MODE_GUIDED
            )

            if not set_guided_mode_res.get("success"):
                return set_guided_mode_res

            if not self.reserve_message_type("COMMAND_ACK", self.controller_id):
                return {
                    "success": False,
                    "message": "Could not reserve COMMAND_ACK messages",
                }

            # Send MAV_CMD_NAV_TAKEOFF command
            self.send_command_to_vehicle(
                system_id,
                mavlink.MAV_CMD_NAV_TAKEOFF,
                param1=0,  # pitch
                param2=0,  # empty
                param3=0,  # empty
                param4=0,  # yaw angle (0 = use current)
                param5=0,  # latitude (0 = use current)
                param6=0,  # longitude (0 = use current)
                param7=altitude,  # altitude in meters
            )

            response = self.wait_for_message(
                "COMMAND_ACK",
                self.controller_id,
                conditional_func=lambda msg: (msg.get_srcSystem() == system_id)
                and (msg.command == mavutil.mavlink.MAV_CMD_NAV_TAKEOFF),
            )

            if command_accepted(
                response, mavutil.mavlink.MAV_CMD_NAV_TAKEOFF, self.logger
            ):
                self.logger.debug(f"[{system_id}] Copter takeoff command accepted")
                return {
                    "success": True,
                    "message": "Copter takeoff command sent successfully",
                }
            else:
                self.logger.debug(f"[{system_id}] Copter takeoff command failed")
                return {
                    "success": False,
                    "message": "Could not takeoff copter, command not accepted",
                }

        except Exception as e:
            self.logger.error(e, exc_info=True)
            return {
                "success": False,
                "message": "Could not takeoff copter, serial exception",
            }
        finally:
            self.release_message_type("COMMAND_ACK", self.controller_id)

    def set_vehicle_flight_mode(self, system_id: int, new_flight_mode: int) -> Response:
        if not self.reserve_message_type("COMMAND_ACK", self.controller_id):
            return {
                "success": False,
                "message": "Could not reserve COMMAND_ACK messages",
            }

        try:
            target_vehicle = self.vehicles[system_id]

            if target_vehicle is None:
                return {
                    "success": False,
                    "message": "Vehicle not found",
                }

            flight_mode_map = target_vehicle.flight_mode_map
            if new_flight_mode not in flight_mode_map:
                return {
                    "success": False,
                    "message": "Invalid flight mode",
                }

            new_flight_mode_string = flight_mode_map[new_flight_mode]

            self.send_command_to_vehicle(
                system_id,
                mavlink.MAV_CMD_DO_SET_MODE,
                param1=1,
                param2=new_flight_mode,
            )

            response = self.wait_for_message(
                "COMMAND_ACK",
                self.controller_id,
                conditional_func=lambda msg: (msg.get_srcSystem() == system_id)
                and (msg.command == mavutil.mavlink.MAV_CMD_DO_SET_MODE),
            )

            if command_accepted(
                response, mavutil.mavlink.MAV_CMD_DO_SET_MODE, self.logger
            ):
                self.logger.debug(
                    f"[{system_id}] Flight mode set to {new_flight_mode_string}"
                )
                return {
                    "success": True,
                    "message": f"Flight mode set successfully to {new_flight_mode_string}",
                }
            else:
                self.logger.debug(
                    f"[{system_id}] Could not set flight mode to {new_flight_mode_string}"
                )
                return {
                    "success": False,
                    "message": f"Could not set flight mode to {new_flight_mode_string}, command not accepted",
                }

        except Exception as e:
            self.logger.error(e, exc_info=True)
            return {
                "success": False,
                "message": "Could not set flight mode, serial exception",
            }
        finally:
            self.release_message_type("COMMAND_ACK", self.controller_id)

    def set_all_vehicles_flight_mode(self, new_flight_mode_str: str) -> Response:
        failed_vehicles = []
        try:
            for system_id, vehicle in self.vehicles.items():
                flight_mode_map = vehicle.flight_mode_map
                mode_found = False

                # Find the mode nunber associated with the mode string
                for mode_id, mode_str in flight_mode_map.items():
                    if mode_str == new_flight_mode_str:
                        response = self.set_vehicle_flight_mode(system_id, mode_id)
                        if not response["success"]:
                            failed_vehicles.append(system_id)

                        mode_found = True
                        break

                if not mode_found:
                    failed_vehicles.append(system_id)

            if not failed_vehicles:
                return {
                    "success": True,
                    "message": f"Flight mode set to {new_flight_mode_str} successfully on all vehicles",
                }
            else:
                return {
                    "success": False,
                    "message": f"Could not set flight mode to {new_flight_mode_str} on {len(failed_vehicles)} vehicles",
                }
        except Exception as e:
            self.logger.error(e, exc_info=True)
            return {
                "success": False,
                "message": f"Could not set flight mode to {new_flight_mode_str} on all vehicles, {e}",
            }

    def close(self) -> None:
        self.clear_message_listeners()
        self.is_active.clear()

        self._stop_all_threads()

        if self.master is not None:
            self.master.close()

        self.logger.info("Radio link closed")
