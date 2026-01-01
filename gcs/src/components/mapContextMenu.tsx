import { Menu } from "@mantine/core"
import { IconGps, IconMapPinOff, IconZoomScan } from "@tabler/icons-react"
import { ReactNode } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  selectFollowedVehicleId,
  setFollowedVehicle,
} from "../redux/slices/vehiclesSlice"

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

  function handleCenterAllVehicles() {
    onCenterAllVehicles()
    onClose()
  }

  function handleUnfollowVehicle() {
    dispatch(setFollowedVehicle(null))
    onClose()
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
            leftSection={<IconZoomScan size={16} />}
            onClick={handleCenterAllVehicles}
          >
            Center All Vehicles
          </Menu.Item>

          {followedVehicleId !== null && (
            <>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconMapPinOff size={16} />}
                onClick={handleUnfollowVehicle}
              >
                Unfollow Vehicle {followedVehicleId}
              </Menu.Item>
            </>
          )}
          <Menu.Divider />

          <Menu.Item leftSection={<IconGps size={16} />}>
            {coordinates &&
              `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  )
}
