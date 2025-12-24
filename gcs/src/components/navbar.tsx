import { Button, Text, Tooltip } from "@mantine/core"
import { useDispatch, useSelector } from "react-redux"
import {
  clearInitialHeartbeatMessages,
  ConnectionType,
  emitDisconnectFromRadioLink,
  selectBaudrate,
  selectConnectedToRadioLink,
  selectConnectionType,
  selectIp,
  selectNetworkType,
  selectPort,
  selectSelectedComPort,
  setSecondsWaitedForConnection,
  setShowConnectionModal,
} from "../redux/slices/connectionSlice.js"
import { selectIsConnectedToSocket } from "../redux/slices/socketSlice.js"
import ConnectionModal from "./connectionModal.js"

export default function Navbar(): JSX.Element {
  const dispatch = useDispatch()

  const connectedToSocket = useSelector(selectIsConnectedToSocket)
  const connectedToRadioLink = useSelector(selectConnectedToRadioLink)

  const selectedComPort = useSelector(selectSelectedComPort)
  const selectedBaudRate = useSelector(selectBaudrate)
  const connectionType = useSelector(selectConnectionType)
  const networkType = useSelector(selectNetworkType)
  const ip = useSelector(selectIp)
  const port = useSelector(selectPort)

  function connectToRadioLink() {
    dispatch(clearInitialHeartbeatMessages())
    dispatch(setSecondsWaitedForConnection(0))
    dispatch(setShowConnectionModal(true))
  }

  function disconnectFromRadioLink() {
    dispatch(emitDisconnectFromRadioLink())
  }

  return (
    <div className="absolute top-0 left-0 w-full h-14 flex flex-row items-center justify-end p-2 gap-4 bg-zinc-800/80">
      <ConnectionModal />

      {connectedToRadioLink && (
        <Text>
          <>
            Connected to
            <span className="inline font-bold">
              {
                {
                  [ConnectionType.Serial]: ` ${selectedComPort}:${selectedBaudRate}`,
                  [ConnectionType.Network]: ` ${networkType}:${ip}:${port}`,
                }[connectionType]
              }
            </span>
          </>
        </Text>
      )}

      <Tooltip label="Not connected to socket" disabled={connectedToSocket}>
        <Button
          disabled={!connectedToSocket}
          onClick={() => {
            connectedToRadioLink
              ? disconnectFromRadioLink()
              : connectToRadioLink()
          }}
          color={connectedToRadioLink ? "red" : "green"}
        >
          {connectedToRadioLink ? "Disconnect" : "Connect"}
        </Button>
      </Tooltip>
    </div>
  )
}
