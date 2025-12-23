import {
  initSocket,
  socketConnected,
  socketDisconnected,
} from "./slices/socketSlice"

import { Middleware, UnknownAction } from "@reduxjs/toolkit"
import SocketFactory, { SocketConnection } from "../socket"
import { handleEmitters } from "./emitters"
import {
  emitIsConnectedToDrone,
  setComPorts,
  setConnected,
  setConnecting,
  setConnectionModal,
  setFetchingComPorts,
} from "./slices/connectionSlice"

const SocketEvents = Object.freeze({
  Connect: "connect",
  Disconnect: "disconnect",
  isConnectedToDrone: "is_connected_to_drone",
  listComPorts: "list_com_ports",
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
          store.dispatch(emitIsConnectedToDrone())
        })

        currentSocket.socket.on(SocketEvents.Disconnect, () => {
          console.log(`Disconnected from socket ${currentSocket.socket.id}`)
          store.dispatch(socketDisconnected())
        })

        currentSocket.socket.on("connected", () => {
          store.dispatch(setConnected(true))
        })

        currentSocket.socket.on("disconnect", () => {
          store.dispatch(setConnected(false))
          store.dispatch(setConnecting(false))
        })

        currentSocket.socket.on("is_connected_to_drone", (msg) => {
          console.log(msg)
        })

        currentSocket.socket.on("list_com_ports", (msg) => {
          store.dispatch(setFetchingComPorts(false))
          store.dispatch(setComPorts(msg))
          // const possibleComPort = msg.find(
          //   (port) =>
          //     port.toLowerCase().includes("mavlink") ||
          //     port.toLowerCase().includes("ardupilot"),
          // )
          // if (!store.getState().droneConnection.selected_com_ports) {
          //   // If no com port is selected, select a possible mavlink/ardupilot port if it exists, otherwise select the first port
          //   if (possibleComPort !== undefined) {
          //     store.dispatch(setSelectedComPorts(possibleComPort))
          //   } else if (msg.length > 0) {
          //     store.dispatch(setSelectedComPorts(msg[0]))
          //   }
          // }
        })

        currentSocket.socket.on("disconnected_from_drone", () => {
          store.dispatch(setConnected(false))
          window.ipcRenderer.send("window:update-title", "FGCS")
        })

        currentSocket.socket.on("connection_error", (msg) => {
          console.error("Connection error: " + msg.message)
          // showErrorNotification(msg.message)
          store.dispatch(setConnecting(false))
          store.dispatch(setConnected(false))
        })

        // Flags that the drone is connected
        currentSocket.socket.on("connected_to_drone", (msg) => {
          store.dispatch(setConnected(true))
          store.dispatch(setConnecting(false))
          store.dispatch(setConnectionModal(false))
        })
      }
    }

    // if (setConnected.match(action)) {
    //   // Setup socket listeners on drone connection
    //   if (action.payload && socket) {
    //     socket.socket.on(
    //       DroneSpecificSocketEvents.onForwardingStatus,
    //       (msg) => {
    //         if (msg.success) {
    //           showSuccessNotification(msg.message)
    //         } else {
    //           showErrorNotification(msg.message)
    //         }
    //       },
    //     )
    //   } else {
    //     // Turn off socket events
    //   }
    // }

    // these actions handle emitting based on UI events
    // for each action type, emit socket and pass onto reducer
    if (socket) {
      handleEmitters(socket, store, action as UnknownAction)
    }

    return next(action)
  }
}

export default socketMiddleware
