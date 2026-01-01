import { Menu } from "@mantine/core"
import { IconFocus2, IconMapPin } from "@tabler/icons-react"
import { MouseEvent, ReactNode, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  selectFollowedVehicleId,
  setCenteredVehicle,
  setFollowedVehicle,
} from "../redux/slices/vehiclesSlice"

interface VehicleCardContextMenuProps {
  sysId: number
  children: ReactNode
}

export default function VehicleCardContextMenu({
  sysId,
  children,
}: VehicleCardContextMenuProps) {
  const dispatch = useDispatch()
  const followedVehicleId = useSelector(selectFollowedVehicleId)
  const [opened, setOpened] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

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

          <Menu.Divider />

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
    </>
  )
}
