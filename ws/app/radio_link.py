import logging
import threading
import time
import traceback
from queue import Queue
from typing import Callable, Dict, Optional

import serial
from pymavlink import mavutil
from pymavlink.mavutil import mavlink

from app.drone import Drone


class RadioLink:
    def __init__(self, port: str, baud: int = 57600):
        self.port = port
        self.baud = baud
        self.logger = logging.getLogger("radio_link")

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

        if not self._listen_for_initial_heartbeats():
            self.logger.error("Failed to establish initial heartbeat")
            self.close()
            return

        self.message_listeners: Dict[str, Callable] = {}

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
        self._start_threads()

    def _listen_for_initial_heartbeats(self, timeout: int = 30) -> bool:
        self.logger.info(f"Listening for initial heartbeats for {timeout} seconds")
        start_time = time.time()
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

        if not self.drones:
            return False
        return True

    def _start_threads(self) -> None:
        self.handle_incoming_messages_thread.start()
        self.send_heartbeats_out_thread.start()

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

            if msg_name == "HEARTBEAT":
                drone.handle_heartbeat(msg)
                print(drone)

            elif msg_name == "VFR_HUD":
                drone.handle_vfr_hud(msg)

    def _send_heartbeats_out(self) -> None:
        while self.is_active.is_set():
            self.master.mav.heartbeat_send()
            time.sleep(1)

    def _stop_all_threads(self) -> None:
        this_thread = threading.current_thread()

        for thread in [
            getattr(self, "handle_incoming_messages_thread", None),
            getattr(self, "send_heartbeats_out_thread", None),
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
