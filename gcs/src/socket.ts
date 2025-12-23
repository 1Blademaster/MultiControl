"use client"
import { io } from "socket.io-client"

export class SocketConnection {
  socket
  socketEndpoint = import.meta.env.VITE_BACKEND_URL

  constructor() {
    this.socket = io(this.socketEndpoint)
  }
}

let socketConnection: SocketConnection | undefined = undefined

class SocketFactory {
  static create() {
    if (!socketConnection) {
      socketConnection = new SocketConnection()
    }
    return socketConnection
  }
}
export default SocketFactory
