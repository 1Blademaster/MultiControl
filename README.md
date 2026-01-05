# MultiControl GCS

I couldn't really find any swarm GCS applications out there. I have a multipoint radio link which receives telemetry from multiple vehicles via MAVLink, each vehicle identified by it's system ID. I wanted a GCS application that I can use just as an information display, so no setup, params, log analysis etc as I can use [FGCS](https://github.com/Avis-Drone-Labs/FGCS) for that. I want to be able to either command a single vehicle to do certain actions, or command multiple at once. This will be hopefully be used with my swarm control system which I'll have onboard multiple vehicles.

![UI Screenshot](readme_screenshot.png)

Can launch the SITL instances using `docker-compose up --build` and then use mavproxy to combine the streams into one stream with `mavproxy --master=tcp:127.0.0.1:5761 --master=tcp:127.0.0.1:5771 --master=tcp:127.0.0.1:5781 --master=tcp:127.0.0.1:5791 --out=udpbcast:127.0.0.1:14550`.

To run copy the `.env.sample` as `.env` and enter in your maptiler API key. Then in two terminals run `yarn dev` in the `gcs` directory and `python app.py` in the `ws` directory.
