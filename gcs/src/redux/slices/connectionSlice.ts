import { createSlice, PayloadAction } from "@reduxjs/toolkit"

export const ConnectionType = {
  Serial: "serial",
  Network: "network",
}

interface ConnectToRadioLinkPayload {
  port: string
  baud: number
  connectionType: string
}

const initialState = {
  connectingToRadioLink: false,
  connectedToRadioLink: false,
  showConnectionModal: false,
  connectionType: ConnectionType.Serial,
  baudrate: "57600",
  fetchingComPorts: false,
  comPorts: [],
  selectedComPort: null,
  networkType: "tcp",
  ip: "127.0.0.1",
  port: "5760",
}

const connectionSlice = createSlice({
  name: "connection",
  initialState,
  reducers: {
    setConnectingToRadioLink: (state, action) => {
      if (action.payload !== state.connectingToRadioLink) {
        state.connectingToRadioLink = action.payload
      }
    },
    setConnectedToRadioLink: (state, action) => {
      if (action.payload !== state.connectedToRadioLink) {
        state.connectedToRadioLink = action.payload
      }
    },
    setBaudrate: (state, action) => {
      if (action.payload !== state.baudrate) {
        state.baudrate = action.payload
      }
    },
    setConnectionType: (state, action) => {
      if (action.payload !== state.connectionType) {
        state.connectionType = action.payload
      }
    },
    setFetchingComPorts: (state, action) => {
      if (action.payload !== state.fetchingComPorts) {
        state.fetchingComPorts = action.payload
      }
    },
    setComPorts: (state, action) => {
      if (action.payload !== state.comPorts) {
        state.comPorts = action.payload
      }
    },
    setSelectedComPort: (state, action) => {
      if (action.payload !== state.selectedComPort) {
        state.selectedComPort = action.payload
      }
    },
    setNetworkType: (state, action) => {
      if (action.payload !== state.networkType) {
        state.networkType = action.payload
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
    setShowConnectionModal: (state, action) => {
      if (action.payload !== state.showConnectionModal) {
        state.showConnectionModal = action.payload
      }
    },

    emitIsConnectedToRadioLink: () => {},
    emitGetComPorts: () => {},
    emitConnectToRadioLink: (
      _state,
      _action: PayloadAction<ConnectToRadioLinkPayload>,
    ) => {},
    emitDisconnectFromRadioLink: () => {},
  },
  selectors: {
    selectConnecting: (state) => state.connectingToRadioLink,
    selectConnectedToRadioLink: (state) => state.connectedToRadioLink,
    selectBaudrate: (state) => state.baudrate,
    selectConnectionType: (state) => state.connectionType,
    selectFetchingComPorts: (state) => state.fetchingComPorts,
    selectComPorts: (state) => state.comPorts,
    selectSelectedComPort: (state) => state.selectedComPort,
    selectNetworkType: (state) => state.networkType,
    selectIp: (state) => state.ip,
    selectPort: (state) => state.port,
    selectShowConnectionModal: (state) => state.showConnectionModal,
  },
})

export const {
  setConnectingToRadioLink,
  setConnectedToRadioLink,
  setBaudrate,
  setConnectionType,
  setFetchingComPorts,
  setComPorts,
  setSelectedComPort,
  setNetworkType,
  setIp,
  setPort,
  setShowConnectionModal,

  emitIsConnectedToRadioLink,
  emitGetComPorts,
  emitConnectToRadioLink,
  emitDisconnectFromRadioLink,
} = connectionSlice.actions
export const {
  selectConnecting,
  selectConnectedToRadioLink,
  selectBaudrate,
  selectConnectionType,
  selectFetchingComPorts,
  selectComPorts,
  selectSelectedComPort,
  selectNetworkType,
  selectIp,
  selectPort,
  selectShowConnectionModal,
} = connectionSlice.selectors

export default connectionSlice
