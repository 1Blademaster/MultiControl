import {
  initSocket,
  socketConnected,
  socketDisconnected,
} from "./slices/socketSlice"

import { Middleware, UnknownAction } from "@reduxjs/toolkit"
import SocketFactory, { SocketConnection } from "../socket"
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
  addDrones,
  removeDrones,
  updateGlobalPositionIntData,
  updateHeartbeatData,
  updateVfrHudData,
} from "./slices/dronesSlice"

const SocketEvents = Object.freeze({
  Connect: "connect",
  Disconnect: "disconnect",
  isConnectedToDrone: "is_connected_to_drone",
  listComPorts: "list_com_ports",
})

const TelemetryEvents = Object.freeze({
  onTelemetryMessage: "telemetry_message",
})

const socketMiddleware: Middleware = (store) => {
  let socket: SocketConnection | null = null

  return (next) => (action) => {
    if (initSocket.match(action)) {
      // client side execution
      if (!socket && typeof window !== "undefined") {
        socket = SocketFactory.create()
        const currentSocket = socket

        currentSocket.socket.on(SocketEvents.Connect, () => {
          console.log(`Connected to socket ${currentSocket.socket.id}`)
          store.dispatch(socketConnected())
          store.dispatch(emitIsConnectedToRadioLink())
        })

        currentSocket.socket.on(SocketEvents.Disconnect, () => {
          console.log(`Disconnected from socket ${currentSocket.socket.id}`)
          store.dispatch(socketDisconnected())
          store.dispatch(setConnectedToRadioLink(false))
        })

        currentSocket.socket.on("connect_to_radio_link_result", (msg) => {
          if (msg.success) {
            store.dispatch(setConnectingToRadioLink(false))
            store.dispatch(setConnectedToRadioLink(true))
            store.dispatch(setShowConnectionModal(false))
            showSuccessNotification(msg.message)

            store.dispatch(removeDrones())

            if (msg.data && msg.data.drones) {
              store.dispatch(
                addDrones(
                  msg.data.drones.map(
                    (drone: { system_id: number }) => drone.system_id,
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
      // Setup socket listeners on drone connection
      if (action.payload && socket) {
        socket.socket.on(TelemetryEvents.onTelemetryMessage, (msg) => {
          if (msg.success && msg.data) {
            const packet = msg.data
            switch (packet.mavpackettype) {
              case "HEARTBEAT":
                store.dispatch(updateHeartbeatData(packet))
                break
              case "VFR_HUD":
                store.dispatch(updateVfrHudData(packet))
                break
              case "GLOBAL_POSITION_INT":
                store.dispatch(updateGlobalPositionIntData(packet))
                break
              default:
                break
            }
          }
        })
      } else {
        // Turn off socket events
        Object.values(TelemetryEvents).map((event) => socket?.socket.off(event))
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
