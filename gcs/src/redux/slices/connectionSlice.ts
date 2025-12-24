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
  secondsWaitedForConnection: 0,
  initialHeartbeatMessages: [] as string[],
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
    appendInitialHeartbeatMessage: (state, action) => {
      // Add new heartbeat message to the start of the array
      state.initialHeartbeatMessages.unshift(action.payload)
    },
    clearInitialHeartbeatMessages: (state) => {
      state.initialHeartbeatMessages = []
    },
    setSecondsWaitedForConnection: (state, action) => {
      if (action.payload !== state.secondsWaitedForConnection) {
        state.secondsWaitedForConnection = action.payload
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
    selectInitialHeartbeatMessages: (state) => state.initialHeartbeatMessages,
    selectSecondsWaitedForConnection: (state) =>
      state.secondsWaitedForConnection,
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
  appendInitialHeartbeatMessage,
  clearInitialHeartbeatMessages,
  setSecondsWaitedForConnection,

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
  selectInitialHeartbeatMessages,
  selectSecondsWaitedForConnection,
} = connectionSlice.selectors

export default connectionSlice
