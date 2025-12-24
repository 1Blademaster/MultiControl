import { Text } from "@mantine/core"
import { useMemo } from "react"
import { Marker } from "react-map-gl/maplibre"
import { useSelector } from "react-redux"
import { makeGetGlobalPositionIntData } from "../redux/slices/dronesSlice"
import { centiDegToDeg, intToCoord } from "../utils/dataFormatters"

export default function DroneMarker({
  sysId,
  color,
}: {
  sysId: number
  color: string
}) {
  const selectGlobalPositionIntData = useMemo(
    () => makeGetGlobalPositionIntData(sysId),
    [sysId],
  )

  const globalPositionIntData = useSelector(selectGlobalPositionIntData)

  if (!globalPositionIntData) return null

  const dropShadowString = `drop-shadow(0 0 1px black)`

  return (
    <>
      <Marker
        latitude={intToCoord(globalPositionIntData.lat)}
        longitude={intToCoord(globalPositionIntData.lon)}
        scale={0.1}
        className="cursor-pointer"
      >
        <Text
          size="lg"
          fw={700}
          c={color ?? "#FFFFFF"}
          style={{
            filter: dropShadowString,
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
          }}
        >
          <path
            d="M64 64L32 49.9941L0 64L32 0L64 64Z"
            fill={color ?? "#FFFFFF"}
          />
        </svg>
      </Marker>
    </>
  )
}
