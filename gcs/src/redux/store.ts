import { combineSlices, configureStore } from "@reduxjs/toolkit"
import connectionSlice, {
  setBaudrate,
  setConnectionType,
  setIp,
  setNetworkType,
  setPort,
  setSelectedComPorts,
} from "./slices/connectionSlice"
import socketMiddleware from "./socketMiddleware"

const rootReducer = combineSlices(connectionSlice)

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat([socketMiddleware])
  },
})

// Load individual persisted values from localStorage

const selected_com_port = localStorage.getItem("selected_com_port")
if (selected_com_port !== null) {
  store.dispatch(setSelectedComPorts(selected_com_port))
}

const baudrate = localStorage.getItem("baudrate")
if (baudrate !== null) {
  store.dispatch(setBaudrate(baudrate))
}

const connectionType = localStorage.getItem("connectionType")
if (connectionType !== null) {
  store.dispatch(setConnectionType(connectionType))
}

const networkType = localStorage.getItem("networkType")
if (networkType !== null) {
  store.dispatch(setNetworkType(networkType))
}

const ip = localStorage.getItem("ip")
if (ip !== null) {
  store.dispatch(setIp(ip))
}

const port = localStorage.getItem("port")
if (port !== null) {
  store.dispatch(setPort(port))
}

const updateLocalStorageIfChanged = (
  key: string,
  newValue: string | number,
) => {
  if (newValue !== null && newValue !== undefined) {
    const currentValue = localStorage.getItem(key)
    const stringValue = String(newValue)
    if (currentValue !== stringValue) {
      localStorage.setItem(key, stringValue)
    }
  }
}

// Update states when a new message comes in
store.subscribe(() => {
  const store_mut = store.getState()

  if (typeof store_mut.connection.selected_com_ports === "string") {
    updateLocalStorageIfChanged(
      "selected_com_port",
      store_mut.connection.selected_com_ports,
    )
  }

  if (typeof store_mut.connection.baudrate === "string") {
    updateLocalStorageIfChanged("baudrate", store_mut.connection.baudrate)
  }

  if (typeof store_mut.connection.connection_type === "string") {
    updateLocalStorageIfChanged(
      "connectionType",
      store_mut.connection.connection_type,
    )
  }

  if (typeof store_mut.connection.network_type === "string") {
    updateLocalStorageIfChanged(
      "networkType",
      store_mut.connection.network_type,
    )
  }

  if (typeof store_mut.connection.ip === "string") {
    updateLocalStorageIfChanged("ip", store_mut.connection.ip)
  }

  if (typeof store_mut.connection.port === "string") {
    updateLocalStorageIfChanged("port", store_mut.connection.port)
  }
})
