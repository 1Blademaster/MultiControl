import logging
import time

from app.radio_link import RadioLink

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%H:%M:%S",
)

link = RadioLink("udp:127.0.0.1:14550")

try:
    while link.is_active.is_set():
        time.sleep(1)
except KeyboardInterrupt:
    pass
finally:
    link.close()
