import { MiddlewareAPI, UnknownAction } from "@reduxjs/toolkit"
import { SocketConnection } from "../socket"
import {
  emitConnectToRadioLink,
  emitDisconnectFromRadioLink,
  emitGetComPorts,
  emitIsConnectedToRadioLink,
  setConnectingToRadioLink,
  setFetchingComPorts,
} from "./slices/connectionSlice"
import {
  emitArmAllVehicles,
  emitArmVehicle,
  emitDisarmAllVehicles,
  emitDisarmVehicle,
  emitSetAllVehiclesFlightMode,
  emitSetVehicleFlightMode,
} from "./slices/vehiclesSlice"

export function handleEmitters(
  socket: SocketConnection,
  store: MiddlewareAPI,
  action: UnknownAction,
) {
  if (!socket) return
  const emitHandlers = [
    {
      emitter: emitIsConnectedToRadioLink,
      callback: () => socket.socket.emit("is_connected_to_radio_link"),
    },
    {
      emitter: emitConnectToRadioLink,
      callback: () => {
        socket.socket.emit("connect_to_radio_link", action.payload)
        store.dispatch(setConnectingToRadioLink(true))
      },
    },
    {
      emitter: emitDisconnectFromRadioLink,
      callback: () => {
        socket.socket.emit("disconnect_from_radio_link")
      },
    },
    {
      emitter: emitGetComPorts,
      callback: () => {
        socket.socket.emit("get_com_ports")
        store.dispatch(setFetchingComPorts(true))
      },
    },

    {
      emitter: emitArmVehicle,
      callback: () => {
        socket.socket.emit("arm_vehicle", action.payload)
      },
    },
    {
      emitter: emitArmAllVehicles,
      callback: () => {
        socket.socket.emit("arm_all_vehicles", action.payload)
      },
    },
    {
      emitter: emitDisarmVehicle,
      callback: () => {
        socket.socket.emit("disarm_vehicle", action.payload)
      },
    },
    {
      emitter: emitDisarmAllVehicles,
      callback: () => {
        socket.socket.emit("disarm_all_vehicles", action.payload)
      },
    },
    {
      emitter: emitSetVehicleFlightMode,
      callback: () => {
        socket.socket.emit("set_vehicle_flight_mode", action.payload)
      },
    },
    {
      emitter: emitSetAllVehiclesFlightMode,
      callback: () => {
        socket.socket.emit("set_all_vehicles_flight_mode", action.payload)
      },
    },
  ]

  for (const { emitter, callback } of emitHandlers) {
    if (emitter.match(action)) {
      callback()
      break
    }
  }
}
