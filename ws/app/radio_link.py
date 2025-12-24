import logging
import threading
import time
import traceback
from queue import Empty, Queue
from typing import Callable, Dict, Optional

import serial
from pymavlink import mavutil
from pymavlink.mavutil import mavlink

from app.drone import Drone


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
            if time.time() - start_time > timeout:
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
        while self.is_active.is_set():
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

            if msg_name in self.message_listeners:
                self.message_queue.put([msg_name, msg])

    def _send_heartbeats_out(self) -> None:
        while self.is_active.is_set():
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

    def get_drones(self) -> list:
        return [drone.serialize() for drone in self.drones.values()]

    def close(self) -> None:
        self.clear_message_listeners()
        self.is_active.clear()

        self._stop_all_threads()

        self.master.close()

        self.logger.info("Radio link closed")
