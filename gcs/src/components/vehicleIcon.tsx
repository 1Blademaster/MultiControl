import {
  IconAntenna,
  IconCar,
  IconDrone,
  IconFerry,
  IconPlane,
  IconSubmarine,
} from "@tabler/icons-react"
import { VehicleType } from "../redux/slices/vehiclesSlice"

export default function VehicleIcon({
  vehicleType,
  color,
}: {
  vehicleType: VehicleType
  color?: string
}) {
  const className = "inline"
  switch (vehicleType) {
    case VehicleType.COPTER:
      return <IconDrone className={className} color={color} />
    case VehicleType.PLANE:
      return <IconPlane className={className} color={color} />
    case VehicleType.ROVER:
      return <IconCar className={className} color={color} />
    case VehicleType.BOAT:
      return <IconFerry className={className} color={color} />
    case VehicleType.TRACKER:
      return <IconAntenna className={className} color={color} />
    case VehicleType.SUB:
      return <IconSubmarine className={className} color={color} />
    default:
      return null
  }
}
