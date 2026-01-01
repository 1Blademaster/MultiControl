import { Text } from "@mantine/core"
import { useMemo } from "react"
import { Marker } from "react-map-gl/maplibre"
import { useDispatch, useSelector } from "react-redux"
import {
  makeGetGlobalPositionIntData,
  selectHoveredVehicleId,
  setHoveredVehicle,
} from "../redux/slices/vehiclesSlice"
import { centiDegToDeg, intToCoord } from "../utils/dataFormatters"

export default function VehicleMarker({
  sysId,
  color,
}: {
  sysId: number
  color: string
}) {
  const dispatch = useDispatch()
  const selectGlobalPositionIntData = useMemo(
    () => makeGetGlobalPositionIntData(sysId),
    [sysId],
  )

  const globalPositionIntData = useSelector(selectGlobalPositionIntData)
  const hoveredVehicleId = useSelector(selectHoveredVehicleId)

  if (!globalPositionIntData) return null

  const isCardHovered = hoveredVehicleId === sysId
  const dropShadowString = isCardHovered
    ? `drop-shadow(0 0 4px white)`
    : `drop-shadow(0 0 1px black)`

  return (
    <Marker
      latitude={intToCoord(globalPositionIntData.lat)}
      longitude={intToCoord(globalPositionIntData.lon)}
      scale={0.1}
      className="cursor-pointer"
    >
      <div
        onMouseEnter={() => dispatch(setHoveredVehicle(sysId))}
        onMouseLeave={() => dispatch(setHoveredVehicle(null))}
      >
        <Text
          size="lg"
          fw={700}
          c={color ?? "#FFFFFF"}
          style={{
            filter: dropShadowString,
            lineHeight: 1,
            transition: "filter 0.2s ease",
          }}
        >
          {sysId}
        </Text>

        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          style={{
            transform: `rotate(${centiDegToDeg(globalPositionIntData.hdg)}deg)`,
            filter: dropShadowString,
            transition: "filter 0.2s ease",
          }}
        >
          <path
            d="M64 64L32 49.9941L0 64L32 0L64 64Z"
            fill={color ?? "#FFFFFF"}
          />
        </svg>
      </div>
    </Marker>
  )
}
