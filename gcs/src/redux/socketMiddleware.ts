import {
  initSocket,
  socketConnected,
  socketDisconnected,
} from "./slices/socketSlice"

import { Middleware, UnknownAction } from "@reduxjs/toolkit"
import SocketFactory, { SocketConnection } from "../socket"
import { isGuidedMode } from "../utils/mavlinkUtils"
import {
  showErrorNotification,
  showSuccessNotification,
} from "../utils/notifications"
import { handleEmitters } from "./emitters"
import {
  appendInitialHeartbeatMessage,
  emitIsConnectedToRadioLink,
  setComPorts,
  setConnectedToRadioLink,
  setConnectingToRadioLink,
  setFetchingComPorts,
  setSecondsWaitedForConnection,
  setShowConnectionModal,
} from "./slices/connectionSlice"
import {
  addVehicles,
  appendToStatusTextMessages,
  clearAllTargetPositions,
  clearStatusTextMessages,
  clearTargetPosition,
  removeVehicles,
  updateAttitudeData,
  updateBatteryStatusData,
  updateEkfStatusReportData,
  updateGlobalPositionIntData,
  updateGpsRawIntData,
  updateHeartbeatData,
  updateSystemStatusData,
  updateVfrHudData,
  updateVibrationData,
  VehicleType,
} from "./slices/vehiclesSlice"

const SocketEvents = Object.freeze({
  Connect: "connect",
  Disconnect: "disconnect",
  isConnectedToVehicle: "is_connected_to_vehicle",
  listComPorts: "list_com_ports",
})

const TelemetryEvents = Object.freeze({
  onTelemetryMessage: "telemetry_message",
})

const ActionEvents = Object.freeze({
  onArmVehicleResult: "arm_vehicle_result",
  onArmAllVehiclesResult: "arm_all_vehicles_result",
  onDisarmVehicleResult: "disarm_vehicle_result",
  onDisarmAllVehiclesResult: "disarm_all_vehicles_result",
  onSetVehicleFlightModeResult: "set_vehicle_flight_mode_result",
  onSetAllVehiclesFlightModeResult: "set_all_vehicles_flight_mode_result",
  onCopterTakeoffResult: "copter_takeoff_result",
  onGotoPositionResult: "goto_position_result",
})

const socketMiddleware: Middleware = (store) => {
  let socket: SocketConnection | null = null

  return (next) => (action) => {
    if (initSocket.match(action)) {
      // client side execution
      if (!socket && typeof window !== "undefined") {
        socket = SocketFactory.create()
        const currentSocket = socket
        store.dispatch(setConnectedToRadioLink(false))

        currentSocket.socket.on(SocketEvents.Connect, () => {
          console.log(`Connected to socket ${currentSocket.socket.id}`)
          store.dispatch(socketConnected())
          store.dispatch(emitIsConnectedToRadioLink())
          store.dispatch(setConnectedToRadioLink(false))
        })

        currentSocket.socket.on(SocketEvents.Disconnect, () => {
          console.log("Disconnected from socket")
          store.dispatch(socketDisconnected())
          store.dispatch(setConnectedToRadioLink(false))
        })

        currentSocket.socket.on("connect_to_radio_link_result", (msg) => {
          if (msg.success) {
            store.dispatch(setConnectingToRadioLink(false))
            store.dispatch(setConnectedToRadioLink(true))
            store.dispatch(setShowConnectionModal(false))
            showSuccessNotification(msg.message)

            store.dispatch(removeVehicles())
            store.dispatch(clearStatusTextMessages())
            store.dispatch(clearAllTargetPositions())

            if (msg.data && msg.data.vehicles) {
              store.dispatch(
                addVehicles(
                  msg.data.vehicles.map(
                    (vehicle: {
                      system_id: number
                      vehicle_type: VehicleType
                    }) => ({
                      system_id: vehicle.system_id,
                      vehicle_type: vehicle.vehicle_type,
                    }),
                  ),
                ),
              )
            }
          } else {
            store.dispatch(setConnectedToRadioLink(false))
            store.dispatch(setConnectingToRadioLink(false))
            showErrorNotification(msg.message)
          }
        })

        currentSocket.socket.on("disconnect_from_radio_link_result", (msg) => {
          if (msg.success) {
            store.dispatch(setConnectedToRadioLink(false))
            store.dispatch(setConnectingToRadioLink(false))
          }
          // TODO: Currently no failure is emitted
        })

        currentSocket.socket.on("is_connected_to_radio_link_result", (msg) => {
          store.dispatch(setConnectedToRadioLink(msg.data))
        })

        currentSocket.socket.on("get_com_ports_result", (msg) => {
          store.dispatch(setFetchingComPorts(false))
          store.dispatch(setComPorts(msg.data))
        })

        currentSocket.socket.on("connection_error", (msg) => {
          console.error("Connection error: " + msg.message)
          store.dispatch(setConnectingToRadioLink(false))
          store.dispatch(setConnectedToRadioLink(false))
        })

        currentSocket.socket.on("initial_heartbeat_update", (msg) => {
          if (msg.data !== undefined) {
            store.dispatch(setSecondsWaitedForConnection(msg.data))
          } else {
            store.dispatch(appendInitialHeartbeatMessage(msg.message))
          }
        })
      }
    }

    if (setConnectedToRadioLink.match(action)) {
      // Setup socket listeners on vehicle connection
      if (action.payload && socket) {
        socket.socket.on(TelemetryEvents.onTelemetryMessage, (msg) => {
          if (msg.success && msg.data) {
            const packet = msg.data
            switch (packet.mavpackettype) {
              case "HEARTBEAT": {
                // Get previous flight mode before updating
                const state = store.getState()
                const previousHeartbeat =
                  state.vehicles.heartbeatData[packet.system_id]
                const vehicleType =
                  state.vehicles.vehicleTypes[packet.system_id]

                store.dispatch(
                  updateHeartbeatData({
                    system_id: packet.system_id,
                    type: packet.type,
                    autopilot: packet.autopilot,
                    base_mode: packet.base_mode,
                    custom_mode: packet.custom_mode,
                    system_status: packet.system_status,
                  }),
                )

                // Check if vehicle left GUIDED mode
                if (previousHeartbeat && vehicleType) {
                  const wasInGuided = isGuidedMode(
                    vehicleType,
                    previousHeartbeat.custom_mode,
                  )
                  const isInGuided = isGuidedMode(
                    vehicleType,
                    packet.custom_mode,
                  )

                  if (wasInGuided && !isInGuided) {
                    // Vehicle left GUIDED mode, clear its target position
                    store.dispatch(clearTargetPosition(packet.system_id))
                  }
                }
                break
              }
              case "STATUSTEXT":
                store.dispatch(
                  appendToStatusTextMessages({
                    system_id: packet.system_id,
                    text: packet.text,
                    severity: packet.severity,
                    timestamp: Date.now(),
                  }),
                )
                break
              case "VFR_HUD":
                store.dispatch(
                  updateVfrHudData({
                    system_id: packet.system_id,
                    heading: packet.heading,
                    alt: packet.alt,
                    groundSpeed: packet.groundSpeed,
                    climb: packet.climb,
                  }),
                )
                break
              case "GLOBAL_POSITION_INT":
                store.dispatch(
                  updateGlobalPositionIntData({
                    system_id: packet.system_id,
                    lat: packet.lat,
                    lon: packet.lon,
                    alt: packet.alt,
                    relative_alt: packet.relative_alt,
                    hdg: packet.hdg,
                  }),
                )
                break
              case "ATTITUDE":
                store.dispatch(
                  updateAttitudeData({
                    system_id: packet.system_id,
                    pitch: packet.pitch,
                    roll: packet.roll,
                    yaw: packet.yaw,
                  }),
                )
                break
              case "BATTERY_STATUS":
                store.dispatch(
                  updateBatteryStatusData({
                    system_id: packet.system_id,
                    voltage: packet.voltages[0],
                    current: packet.current,
                    current_consumed: packet.current_consumed,
                    battery_remaining: packet.battery_remaining,
                  }),
                )
                break
              case "SYS_STATUS":
                store.dispatch(
                  updateSystemStatusData({
                    system_id: packet.system_id,
                    onboard_control_sensors_enabled:
                      packet.onboard_control_sensors_enabled,
                    onboard_control_sensors_health:
                      packet.onboard_control_sensors_health,
                  }),
                )
                break
              case "GPS_RAW_INT":
                store.dispatch(
                  updateGpsRawIntData({
                    system_id: packet.system_id,
                    fix_type: packet.fix_type,
                    eph: packet.eph,
                    epv: packet.epv,
                    satellites_visible: packet.satellites_visible,
                  }),
                )
                break
              case "VIBRATION":
                store.dispatch(
                  updateVibrationData({
                    system_id: packet.system_id,
                    vibration_x: packet.vibration_x,
                    vibration_y: packet.vibration_y,
                    vibration_z: packet.vibration_z,
                    clipping_0: packet.clipping_0,
                    clipping_1: packet.clipping_1,
                    clipping_2: packet.clipping_2,
                  }),
                )
                break
              case "EKF_STATUS_REPORT":
                store.dispatch(
                  updateEkfStatusReportData({
                    system_id: packet.system_id,
                    flags: packet.flags,
                    velocity_variance: packet.velocity_variance,
                    pos_horiz_variance: packet.pos_horiz_variance,
                    pos_vert_variance: packet.pos_vert_variance,
                    compass_variance: packet.compass_variance,
                    terrain_alt_variance: packet.terrain_alt_variance,
                  }),
                )
                break
              default:
                break
            }
          }
        })

        socket.socket.on(ActionEvents.onArmVehicleResult, (msg) => {
          if (msg.success) {
            showSuccessNotification(msg.message)
          } else {
            showErrorNotification(msg.message)
          }
        })
        socket.socket.on(ActionEvents.onArmAllVehiclesResult, (msg) => {
          if (msg.success) {
            showSuccessNotification(msg.message)
          } else {
            showErrorNotification(msg.message)
          }
        })
        socket.socket.on(ActionEvents.onDisarmVehicleResult, (msg) => {
          if (msg.success) {
            showSuccessNotification(msg.message)
          } else {
            showErrorNotification(msg.message)
          }
        })
        socket.socket.on(ActionEvents.onDisarmAllVehiclesResult, (msg) => {
          if (msg.success) {
            showSuccessNotification(msg.message)
          } else {
            showErrorNotification(msg.message)
          }
        })
        socket.socket.on(ActionEvents.onSetVehicleFlightModeResult, (msg) => {
          if (msg.success) {
            showSuccessNotification(msg.message)
          } else {
            showErrorNotification(msg.message)
          }
        })
        socket.socket.on(
          ActionEvents.onSetAllVehiclesFlightModeResult,
          (msg) => {
            if (msg.success) {
              showSuccessNotification(msg.message)
            } else {
              showErrorNotification(msg.message)
            }
          },
        )
        socket.socket.on(ActionEvents.onCopterTakeoffResult, (msg) => {
          if (msg.success) {
            showSuccessNotification(msg.message)
          } else {
            showErrorNotification(msg.message)
          }
        })
        socket.socket.on(ActionEvents.onGotoPositionResult, (msg) => {
          if (msg.success) {
            showSuccessNotification(msg.message)
          } else {
            showErrorNotification(msg.message)
          }
        })
      } else {
        // Turn off socket events
        Object.values(TelemetryEvents).map((event) => socket?.socket.off(event))
        Object.values(ActionEvents).map((event) => socket?.socket.off(event))
      }
    }

    // these actions handle emitting based on UI events
    // for each action type, emit socket and pass onto reducer
    if (socket) {
      handleEmitters(socket, store, action as UnknownAction)
    }

    return next(action)
  }
}

export default socketMiddleware
