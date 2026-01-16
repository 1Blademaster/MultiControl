import { Button, Menu, Modal, NumberInput } from "@mantine/core"
import {
  IconGps,
  IconMapPin,
  IconMapPinOff,
  IconProps,
  IconRulerMeasure,
  IconZoomScan,
} from "@tabler/icons-react"
import { ReactNode, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  selectFollowedVehicleId,
  selectVehicleColors,
  selectVehicleSysIds,
  selectVehicleTypes,
  setFollowedVehicle,
  setTargetPosition,
} from "../redux/slices/vehiclesSlice"
import SocketFactory from "../socket"
import VehicleIcon from "./vehicleIcon"

interface MapContextMenuProps {
  children: ReactNode
  onCenterAllVehicles: () => void
  opened: boolean
  onClose: () => void
  position: { x: number; y: number }
  coordinates: { lat: number; lng: number } | null
}

export default function MapContextMenu({
  children,
  onCenterAllVehicles,
  opened,
  onClose,
  position,
  coordinates,
}: MapContextMenuProps) {
  const dispatch = useDispatch()
  const followedVehicleId = useSelector(selectFollowedVehicleId)
  const vehicleSysIds = useSelector(selectVehicleSysIds)
  const vehicleTypes = useSelector(selectVehicleTypes)
  const vehicleColors = useSelector(selectVehicleColors)
  const [altitudeModalOpened, setAltitudeModalOpened] = useState(false)
  const [targetAltitude, setTargetAltitude] = useState<number>(10)

  function handleCenterAllVehicles() {
    onCenterAllVehicles()
    onClose()
  }

  function handleUnfollowVehicle() {
    dispatch(setFollowedVehicle(null))
    onClose()
  }

  function handleSendVehicleToPosition(sysId: number) {
    if (!coordinates) return

    // Store target position in Redux for marker display
    dispatch(
      setTargetPosition({
        system_id: sysId,
        lat: coordinates.lat,
        lon: coordinates.lng,
        altitude: targetAltitude,
      }),
    )

    const socketConnection = SocketFactory.create()
    socketConnection.socket.emit("goto_position", {
      system_id: sysId,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      altitude: targetAltitude,
    })
    onClose()
  }

  function handleOpenAltitudeModal() {
    setAltitudeModalOpened(true)
    onClose()
  }

  function handleSetAltitude() {
    // Emit the new altitude target to backend
    const socketConnection = SocketFactory.create()
    socketConnection.socket.emit("set_altitude_target", {
      altitude: targetAltitude,
    })
    setAltitudeModalOpened(false)
  }

  function getVehicleTypeIcon(
    sysId: number,
    props?: IconProps & React.SVGProps<SVGSVGElement>,
  ) {
    const vehicleType = vehicleTypes[sysId]
    const color = vehicleColors[sysId]
    return <VehicleIcon vehicleType={vehicleType} color={color} {...props} />
  }

  return (
    <>
      {children}

      <Menu
        shadow="md"
        width={200}
        opened={opened}
        onChange={onClose}
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
          <Menu.Label>Map Actions</Menu.Label>

          <Menu.Item
            leftSection={<IconZoomScan size={18} />}
            onClick={handleCenterAllVehicles}
          >
            Center All Vehicles
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            leftSection={<IconRulerMeasure size={18} />}
            onClick={handleOpenAltitudeModal}
          >
            Guided Altitude Target: {targetAltitude}m
          </Menu.Item>

          {/* Submenu for sending vehicles to position */}
          <Menu
            trigger="hover"
            openDelay={100}
            closeDelay={400}
            position="right-start"
            offset={2}
            radius={0}
          >
            <Menu.Target>
              <Menu.Item leftSection={<IconMapPin size={18} />}>
                Set Vehicle Guided Target
              </Menu.Item>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Select Vehicle</Menu.Label>
              {vehicleSysIds.length > 0 ? (
                vehicleSysIds.map((sysId) => (
                  <Menu.Item
                    key={sysId}
                    leftSection={getVehicleTypeIcon(sysId, { size: 16 })}
                    onClick={() => handleSendVehicleToPosition(sysId)}
                    style={{ color: vehicleColors[sysId] }}
                  >
                    Vehicle {sysId}
                  </Menu.Item>
                ))
              ) : (
                <Menu.Item disabled>No vehicles available</Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>

          {followedVehicleId !== null && (
            <>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconMapPinOff size={18} />}
                onClick={handleUnfollowVehicle}
              >
                Unfollow Vehicle {followedVehicleId}
              </Menu.Item>
            </>
          )}
          <Menu.Divider />

          <Menu.Item leftSection={<IconGps size={18} />}>
            {coordinates &&
              `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Modal
        opened={altitudeModalOpened}
        onClose={() => setAltitudeModalOpened(false)}
        title="Set Altitude Target"
        centered
        radius={0}
      >
        <NumberInput
          label="Guided Altitude Target (meters)"
          placeholder="Enter altitude"
          value={targetAltitude}
          onChange={(value) => setTargetAltitude(value as number)}
          min={1}
          max={1000}
          step={1}
          required
        />
        <div className="flex gap-2 mt-4">
          <Button
            variant="light"
            color="blue"
            radius={0}
            size="compact-md"
            onClick={handleSetAltitude}
            data-autofocus
          >
            Set Altitude
          </Button>
          <Button
            variant="light"
            color="gray"
            radius={0}
            size="compact-md"
            onClick={() => setAltitudeModalOpened(false)}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  )
}
