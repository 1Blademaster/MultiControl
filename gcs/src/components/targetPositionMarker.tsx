import { Tooltip } from "@mantine/core"
import { IconMapPinFilled } from "@tabler/icons-react"
import { Marker } from "react-map-gl/maplibre"

interface TargetPositionMarkerProps {
  lat: number
  lon: number
  color: string
  altitude: number
}

export default function TargetPositionMarker({
  lat,
  lon,
  color,
  altitude,
}: TargetPositionMarkerProps) {
  return (
    <Marker latitude={lat} longitude={lon}>
      <Tooltip
        label={`Target Altitude: ${altitude}m`}
        position="top"
        color="dark"
      >
        <div>
          <IconMapPinFilled
            size={28}
            color={color}
            fill={color}
            fillOpacity={0.7}
          />
        </div>
      </Tooltip>
    </Marker>
  )
}
