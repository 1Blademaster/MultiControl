import { Button, Menu, Modal, NumberInput } from "@mantine/core"
import { IconFocus2, IconMapPin, IconRocket } from "@tabler/icons-react"
import { MouseEvent, ReactNode, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  selectFollowedVehicleId,
  setCenteredVehicle,
  setFollowedVehicle,
  VehicleType,
} from "../redux/slices/vehiclesSlice"
import SocketFactory from "../socket"

interface VehicleCardContextMenuProps {
  sysId: number
  vehicleType: VehicleType
  children: ReactNode
}

export default function VehicleCardContextMenu({
  sysId,
  vehicleType,
  children,
}: VehicleCardContextMenuProps) {
  const dispatch = useDispatch()
  const followedVehicleId = useSelector(selectFollowedVehicleId)
  const [opened, setOpened] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [takeoffModalOpened, setTakeoffModalOpened] = useState(false)
  const [takeoffAltitude, setTakeoffAltitude] = useState<number>(10)

  function handleContextMenu(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault()
    setPosition({ x: e.clientX, y: e.clientY })
    setOpened(true)
  }

  function handleCenterOnMap() {
    dispatch(setCenteredVehicle(sysId))
    dispatch(setFollowedVehicle(null))
  }

  function handleFollowVehicle() {
    if (followedVehicleId === sysId) {
      // Toggle off if already following this vehicle
      dispatch(setFollowedVehicle(null))
    } else {
      dispatch(setFollowedVehicle(sysId))
    }
  }

  function handleOpenTakeoffModal() {
    setOpened(false)
    setTakeoffModalOpened(true)
  }

  function handleTakeoff() {
    const socketConnection = SocketFactory.create()
    socketConnection.socket.emit("copter_takeoff", {
      system_id: sysId,
      altitude: takeoffAltitude,
    })
    setTakeoffModalOpened(false)
  }

  const isCopter = vehicleType === VehicleType.COPTER

  return (
    <>
      <div onContextMenu={handleContextMenu}>{children}</div>
      <Menu
        shadow="md"
        width={200}
        opened={opened}
        onChange={setOpened}
        position="bottom-start"
        withinPortal
        radius={0}
      >
        <Menu.Target>
          <div
            style={{
              position: "fixed",
              left: position.x,
              top: position.y,
              width: 0,
              height: 0,
            }}
          />
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Vehicle {sysId}</Menu.Label>

          {isCopter && (
            <>
              <Menu.Item
                leftSection={<IconRocket size={16} />}
                onClick={handleOpenTakeoffModal}
              >
                Takeoff
              </Menu.Item>
              <Menu.Divider />
            </>
          )}

          <Menu.Item
            leftSection={<IconMapPin size={16} />}
            onClick={handleCenterOnMap}
          >
            Center on Map
          </Menu.Item>

          <Menu.Item
            leftSection={<IconFocus2 size={16} />}
            onClick={handleFollowVehicle}
            color={followedVehicleId === sysId ? "blue" : undefined}
          >
            {followedVehicleId === sysId
              ? "Unfollow Vehicle"
              : "Follow Vehicle"}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Modal
        opened={takeoffModalOpened}
        onClose={() => setTakeoffModalOpened(false)}
        title="Takeoff"
        centered
        radius={0}
      >
        <NumberInput
          label="Altitude (meters)"
          placeholder="Enter altitude"
          value={takeoffAltitude}
          onChange={(value) => setTakeoffAltitude(value as number)}
          min={1}
          max={1000}
          required
          radius={0}
          hideControls
        />
        <div className="flex gap-2 mt-4">
          <Button
            variant="light"
            color="green"
            radius={0}
            size="compact-md"
            onClick={handleTakeoff}
            data-autofocus
          >
            Takeoff
          </Button>
          <Button
            variant="light"
            color="gray"
            radius={0}
            size="compact-md"
            onClick={() => setTakeoffModalOpened(false)}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  )
}
