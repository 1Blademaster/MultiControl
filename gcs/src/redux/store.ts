import { combineSlices, configureStore } from "@reduxjs/toolkit"
import connectionSlice, {
  setBaudrate,
  setConnectionType,
  setIp,
  setNetworkType,
  setPort,
  setSelectedComPort,
} from "./slices/connectionSlice"
import dronesSlice from "./slices/dronesSlice"
import socketSlice from "./slices/socketSlice"
import socketMiddleware from "./socketMiddleware"

const rootReducer = combineSlices(socketSlice, connectionSlice, dronesSlice)

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat([socketMiddleware])
  },
})

export type RootState = ReturnType<typeof store.getState>

// Load individual persisted values from localStorage

const selectedComPort = localStorage.getItem("selectedComPort")
if (selectedComPort !== null) {
  store.dispatch(setSelectedComPort(selectedComPort))
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

  if (typeof store_mut.connection.selectedComPort === "string") {
    updateLocalStorageIfChanged(
      "selectedComPort",
      store_mut.connection.selectedComPort,
    )
  }

  if (typeof store_mut.connection.baudrate === "string") {
    updateLocalStorageIfChanged("baudrate", store_mut.connection.baudrate)
  }

  if (typeof store_mut.connection.connectionType === "string") {
    updateLocalStorageIfChanged(
      "connectionType",
      store_mut.connection.connectionType,
    )
  }

  if (typeof store_mut.connection.networkType === "string") {
    updateLocalStorageIfChanged("networkType", store_mut.connection.networkType)
  }

  if (typeof store_mut.connection.ip === "string") {
    updateLocalStorageIfChanged("ip", store_mut.connection.ip)
  }

  if (typeof store_mut.connection.port === "string") {
    updateLocalStorageIfChanged("port", store_mut.connection.port)
  }
})
