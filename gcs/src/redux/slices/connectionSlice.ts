import { createSlice } from "@reduxjs/toolkit"

export const ConnectionType = {
  Serial: "serial",
  Network: "network",
}

const initialState = {
  connecting: false,
  connected: false,
  connection_modal: false,
  baudrate: "57600",
  connection_type: ConnectionType.Serial,
  fetching_com_ports: false,
  com_ports: [],
  selected_com_ports: null,
  network_type: "tcp",
  ip: "127.0.0.1",
  port: "5760",
}

const connectionSlice = createSlice({
  name: "connection",
  initialState,
  reducers: {
    setConnecting: (state, action) => {
      if (action.payload !== state.connecting) {
        state.connecting = action.payload
      }
    },
    setConnected: (state, action) => {
      if (action.payload !== state.connected) {
        state.connected = action.payload
      }
    },
    setBaudrate: (state, action) => {
      if (action.payload !== state.baudrate) {
        state.baudrate = action.payload
      }
    },
    setConnectionType: (state, action) => {
      if (action.payload !== state.connection_type) {
        state.connection_type = action.payload
      }
    },
    setFetchingComPorts: (state, action) => {
      if (action.payload !== state.fetching_com_ports) {
        state.fetching_com_ports = action.payload
      }
    },
    setComPorts: (state, action) => {
      if (action.payload !== state.com_ports) {
        state.com_ports = action.payload
      }
    },
    setSelectedComPorts: (state, action) => {
      if (action.payload !== state.selected_com_ports) {
        state.selected_com_ports = action.payload
      }
    },
    setNetworkType: (state, action) => {
      if (action.payload !== state.network_type) {
        state.network_type = action.payload
      }
    },
    setIp: (state, action) => {
      if (action.payload !== state.ip) {
        state.ip = action.payload
      }
    },
    setPort: (state, action) => {
      if (action.payload !== state.port) {
        state.port = action.payload
      }
    },
    setConnectionModal: (state, action) => {
      if (action.payload !== state.connection_modal) {
        state.connection_modal = action.payload
      }
    },

    emitIsConnectedToDrone: () => {},
    emitGetComPorts: (state) => {
      state.fetching_com_ports = true
    },
    emitDisconnectFromDrone: () => {},
    emitConnectToDrone: () => {},
    emitStartForwarding: () => {},
    emitStopForwarding: () => {},
    emitSetState: () => {},
    emitGetHomePosition: () => {},
    emitGetCurrentMissionAll: () => {},
    emitSetLoiterRadius: () => {},
    emitGetLoiterRadius: () => {},
    emitReposition: () => {},
    emitArmDisarm: () => {},
    emitTakeoff: () => {},
    emitLand: () => {},
    emitSetCurrentFlightMode: () => {},
  },
  selectors: {
    selectConnecting: (state) => state.connecting,
    selectConnectedToDrone: (state) => state.connected,
    selectBaudrate: (state) => state.baudrate,
    selectConnectionType: (state) => state.connection_type,
    selectFetchingComPorts: (state) => state.fetching_com_ports,
    selectComPorts: (state) => state.com_ports,
    selectSelectedComPorts: (state) => state.selected_com_ports,
    selectNetworkType: (state) => state.network_type,
    selectIp: (state) => state.ip,
    selectPort: (state) => state.port,
    selectConnectionModal: (state) => state.connection_modal,
  },
})

export const {
  setConnecting,
  setConnected,
  setBaudrate,
  setConnectionType,
  setFetchingComPorts,
  setComPorts,
  setSelectedComPorts,
  setNetworkType,
  setIp,
  setPort,
  setConnectionModal,

  emitIsConnectedToDrone,
  emitGetComPorts,
  emitDisconnectFromDrone,
  emitConnectToDrone,
  emitStartForwarding,
  emitStopForwarding,
  emitSetState,
  emitGetHomePosition,
  emitGetCurrentMissionAll,
  emitSetLoiterRadius,
  emitGetLoiterRadius,
  emitReposition,
  emitArmDisarm,
  emitTakeoff,
  emitLand,
  emitSetCurrentFlightMode,
} = connectionSlice.actions
export const {
  selectConnecting,
  selectConnectedToDrone,
  selectBaudrate,
  selectConnectionType,
  selectFetchingComPorts,
  selectComPorts,
  selectSelectedComPorts,
  selectNetworkType,
  selectIp,
  selectPort,
  selectConnectionModal,
} = connectionSlice.selectors

export default connectionSlice
