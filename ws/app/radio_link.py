import logging
import threading
import time
import traceback
from queue import Empty, Queue
from typing import Callable, Dict, Optional, Set

import serial
from pymavlink import mavutil
from pymavlink.mavutil import mavlink

from app.drone import Drone
from app.types import Response
from app.utils import command_accepted


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
            self.close()
            return

        self.drones: Dict = {}

        if not self._listen_for_initial_heartbeats(5):
            self.logger.error("Failed to establish initial heartbeat")
            self.close()
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

            src_system = heartbeat.get_srcSystem()

            if src_system not in self.drones:
                self.drones[src_system] = Drone(
                    src_system, heartbeat.get_srcComponent()
                )
                self.logger.info(f"New drone added: {src_system}")
                if self.initial_heartbeat_update_callback:
                    self.initial_heartbeat_update_callback(
                        {
                            "success": True,
                            "message": f"Heartbeat received from drone: {src_system}",
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

        if not self.drones:
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
        if self.message_listeners:
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

            if msg_src_system not in self.drones:
                continue

            drone = self.drones[msg_src_system]

            msg_name = msg.get_type()

            if msg_name == "TIMESYNC":
                component_timestamp = msg.ts1
                local_timestamp = time.time_ns()
                self.master.mav.timesync_send(local_timestamp, component_timestamp)
                continue
            elif msg_name == "STATUSTEXT":
                self.logger.info(f"{msg_src_system}: {msg.text}")
            elif msg_name == "HEARTBEAT":
                drone.handle_heartbeat(msg)
            elif msg_name == "VFR_HUD":
                drone.handle_vfr_hud(msg)

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

    def get_drones(self) -> list:
        return [drone.serialize() for drone in self.drones.values()]

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
                # Wait for the drone to be armed fully after the command has been accepted
                self.logger.debug(f"[{system_id}] Waiting for arm")
                while not self.drones[system_id].armed:
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

    def close(self) -> None:
        self.clear_message_listeners()
        self.is_active.clear()

        self._stop_all_threads()

        if self.master is not None:
            self.master.close()

        self.logger.info("Radio link closed")
