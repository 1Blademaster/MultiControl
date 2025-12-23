import { MiddlewareAPI, UnknownAction } from "@reduxjs/toolkit"
import { SocketConnection } from "../socket"
import { emitIsConnectedToDrone } from "./slices/connectionSlice"

export function handleEmitters(
  socket: SocketConnection,
  store: MiddlewareAPI,
  action: UnknownAction,
) {
  if (!socket) return
  const emitHandlers = [
    /*
      ====================
      = DRONE CONNECTION =
      ====================
    */
    {
      emitter: emitIsConnectedToDrone,
      callback: () => socket.socket.emit("is_connected_to_drone"),
    },
  ]

  for (const { emitter, callback } of emitHandlers) {
    if (emitter.match(action)) {
      callback()
      break
    }
  }
}
