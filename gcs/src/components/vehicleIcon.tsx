import {
  IconAntenna,
  IconCar,
  IconDrone,
  IconFerry,
  IconPlane,
  IconProps,
  IconSubmarine,
} from "@tabler/icons-react"
import { VehicleType } from "../redux/slices/vehiclesSlice"

export default function VehicleIcon({
  vehicleType,
  color,
  size,
  props,
}: {
  vehicleType: VehicleType
  color?: string
  size?: number | string
  props?: IconProps & React.SVGProps<SVGSVGElement>
}) {
  const className = "inline"
  const iconProps = { size, ...props }
  switch (vehicleType) {
    case VehicleType.COPTER:
      return <IconDrone className={className} color={color} {...iconProps} />
    case VehicleType.PLANE:
      return <IconPlane className={className} color={color} {...iconProps} />
    case VehicleType.ROVER:
      return <IconCar className={className} color={color} {...iconProps} />
    case VehicleType.BOAT:
      return <IconFerry className={className} color={color} {...iconProps} />
    case VehicleType.TRACKER:
      return <IconAntenna className={className} color={color} {...iconProps} />
    case VehicleType.SUB:
      return (
        <IconSubmarine className={className} color={color} {...iconProps} />
      )
    default:
      return null
  }
}
