import {
  Button,
  Group,
  LoadingOverlay,
  Modal,
  Progress,
  ScrollArea,
  SegmentedControl,
  Select,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core"
import { IconRefresh } from "@tabler/icons-react"
import { useDispatch, useSelector } from "react-redux"
import {
  ConnectionType,
  emitConnectToRadioLink,
  emitGetComPorts,
  selectBaudrate,
  selectComPorts,
  selectConnecting,
  selectConnectionType,
  selectFetchingComPorts,
  selectInitialHeartbeatMessages,
  selectIp,
  selectNetworkType,
  selectPort,
  selectSecondsWaitedForConnection,
  selectSelectedComPort,
  selectShowConnectionModal,
  setBaudrate,
  setConnectingToRadioLink,
  setConnectionType,
  setIp,
  setNetworkType,
  setPort,
  setSelectedComPort,
  setShowConnectionModal,
} from "../redux/slices/connectionSlice"
import { selectIsConnectedToSocket } from "../redux/slices/socketSlice"
import { showErrorNotification } from "../utils/notifications"

export default function ConnectionModal() {
  const dispatch = useDispatch()

  const connectedToSocket = useSelector(selectIsConnectedToSocket)
  const showConnectionModal = useSelector(selectShowConnectionModal)
  const connectionType = useSelector(selectConnectionType)
  const selectedComPort = useSelector(selectSelectedComPort)
  const selectedBaudRate = useSelector(selectBaudrate)
  const ip = useSelector(selectIp)
  const port = useSelector(selectPort)
  const networkType = useSelector(selectNetworkType)
  const connecting = useSelector(selectConnecting)
  const fetchingComPorts = useSelector(selectFetchingComPorts)
  const comPorts = useSelector(selectComPorts)
  const initialHeartbeatMessages = useSelector(selectInitialHeartbeatMessages)
  const secondsWaitedForConnection = useSelector(
    selectSecondsWaitedForConnection,
  )

  function connectToRadioLink(type: string) {
    if (type === ConnectionType.Serial) {
      if (selectedComPort === null) {
        showErrorNotification("Serial port must be selected")
        return
      }

      dispatch(
        emitConnectToRadioLink({
          port: selectedComPort,
          baud: parseInt(selectedBaudRate),
          connectionType: type,
        }),
      )
    } else if (type === ConnectionType.Network) {
      if (ip === "" || port === "") {
        showErrorNotification("IP Address and Port cannot be empty")
        return
      }
      const networkString = `${networkType}:${ip}:${port}`
      dispatch(
        emitConnectToRadioLink({
          port: networkString,
          baud: 115200,
          connectionType: type,
        }),
      )
    } else {
      return
    }
  }
  return (
    <Modal
      opened={showConnectionModal}
      onClose={() => {
        dispatch(setShowConnectionModal(false))
        dispatch(setConnectingToRadioLink(false))
      }}
      title="Connect to radio link"
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      withCloseButton={false}
      closeOnClickOutside={!connecting}
      closeOnEscape={!connecting}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          connectToRadioLink(connectionType)
        }}
      >
        <Tabs
          value={connectionType}
          onChange={(value) => dispatch(setConnectionType(value))}
        >
          <Tabs.List grow>
            <Tabs.Tab value={ConnectionType.Serial}>Serial Connection</Tabs.Tab>
            <Tabs.Tab value={ConnectionType.Network}>
              Network Connection
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value={ConnectionType.Serial} className="py-4">
            <LoadingOverlay visible={fetchingComPorts} />
            <div className="flex flex-col space-y-4">
              <Select
                label="COM Port"
                description="Select a COM Port from the ones available"
                placeholder={
                  comPorts.length ? "Select a COM port" : "No COM ports found"
                }
                data={comPorts}
                value={selectedComPort}
                onChange={(value) => dispatch(setSelectedComPort(value))}
                rightSectionPointerEvents="all"
                rightSection={<IconRefresh />}
                rightSectionProps={{
                  onClick: () => dispatch(emitGetComPorts()),
                  className: "hover:cursor-pointer hover:bg-transparent/50",
                }}
              />
              <Select
                label="Baud Rate"
                description="Select a baud rate for the specified COM Port"
                data={[
                  "300",
                  "1200",
                  "4800",
                  "9600",
                  "19200",
                  "13400",
                  "38400",
                  "57600",
                  "74880",
                  "115200",
                  "230400",
                  "250000",
                ]}
                value={selectedBaudRate}
                onChange={(value) => dispatch(setBaudrate(value))}
              />
            </div>
          </Tabs.Panel>
          <Tabs.Panel value={ConnectionType.Network} className="py-4">
            <div className="flex flex-col space-y-4">
              <SegmentedControl
                value={networkType}
                onChange={(value) => dispatch(setNetworkType(value))}
                data={[
                  { value: "tcp", label: "TCP" },
                  { value: "udp", label: "UDP" },
                ]}
              />
              <TextInput
                label="IP Address"
                placeholder="127.0.0.1"
                value={ip}
                onChange={(event) => dispatch(setIp(event.currentTarget.value))}
                data-autofocus
              />
              <TextInput
                label="Port"
                placeholder="5760"
                value={port}
                onChange={(event) =>
                  dispatch(setPort(event.currentTarget.value))
                }
              />
            </div>
          </Tabs.Panel>
        </Tabs>

        <Group justify="space-between" className="pt-4">
          <Button
            variant="filled"
            color={"red"}
            onClick={() => {
              dispatch(setShowConnectionModal(false))
              dispatch(setConnectingToRadioLink(false))
            }}
            disabled={connecting}
          >
            Close
          </Button>
          <Button
            variant="filled"
            type="submit"
            color={"green"}
            disabled={
              !connectedToSocket ||
              (connectionType == ConnectionType.Serial &&
                selectedComPort === null)
            }
            loading={connecting}
          >
            Connect
          </Button>
        </Group>
      </form>

      {connecting &&
        secondsWaitedForConnection !== null &&
        typeof secondsWaitedForConnection === "number" && (
          <Progress
            animated
            size="lg"
            transitionDuration={300}
            value={(secondsWaitedForConnection / 5) * 100} // Need to extract into setting
            className="w-full mx-auto my-4"
          />
        )}

      {initialHeartbeatMessages.length !== 0 && (
        <ScrollArea h={100}>
          <div className="flex flex-col mt-4 text-center">
            {initialHeartbeatMessages.map((message, index) => (
              <Text key={index} size="sm" c="dimmed">
                {message}
              </Text>
            ))}
          </div>
        </ScrollArea>
      )}
    </Modal>
  )
}
