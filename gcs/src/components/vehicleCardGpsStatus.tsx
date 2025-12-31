import { List, Text, Tooltip } from "@mantine/core"
import { GpsFixType } from "mavlink-mappings/dist/lib/common"
import { useMemo } from "react"
import { useSelector } from "react-redux"
import { makeGetGpsRawIntData } from "../redux/slices/vehiclesSlice"
import { formatNumber } from "../utils/dataFormatters"

export default function VehicleCardGpsStatus({ sysId }: { sysId: number }) {
  const selectGpsRawIntData = useMemo(
    () => makeGetGpsRawIntData(sysId),
    [sysId],
  )

  const gpsRawIntData = useSelector(selectGpsRawIntData)

  const statusData: { color: string; details: string[] } | null =
    useMemo(() => {
      if (!gpsRawIntData) return null

      const details: string[] = []
      let color: "green" | "orange" | "red" = "green"

      const updateColor = (newColor: "green" | "orange" | "red") => {
        const severity = { green: 0, orange: 1, red: 2 }
        if (severity[newColor] > severity[color]) {
          color = newColor
        }
      }

      const fixType = gpsRawIntData.fix_type
      if (fixType === GpsFixType.NO_GPS || fixType === GpsFixType.NO_FIX) {
        updateColor("red")
        details.push(`Fix type: ${GpsFixType[fixType]}`)
      } else if (fixType === GpsFixType.GPS_FIX_TYPE_2D_FIX) {
        updateColor("orange")
        details.push(`Fix type: ${GpsFixType[fixType]}`)
      } else if (fixType >= GpsFixType.GPS_FIX_TYPE_3D_FIX) {
        updateColor("green")
      }

      if (gpsRawIntData.satellites_visible < 10) {
        updateColor("orange")
        details.push(`Sats visible: ${gpsRawIntData.satellites_visible}`)
      }
      if (gpsRawIntData.satellites_visible < 6) {
        updateColor("red")
        details.push(`Sats visible: ${gpsRawIntData.satellites_visible}`)
      }

      // HDOP
      const ephMeters = gpsRawIntData.eph / 100
      if (ephMeters > 2) {
        updateColor("red")
        details.push(`HDOP: ${formatNumber(ephMeters)}m`)
      } else if (ephMeters > 1) {
        updateColor("orange")
        details.push(`HDOP: ${formatNumber(ephMeters)}m`)
      } else {
        updateColor("green")
      }

      return { color, details }
    }, [gpsRawIntData])

  if (statusData === null) {
    return <Text>GPS</Text>
  }

  return (
    <Tooltip
      label={
        <>
          <Text>GPS Issues:</Text>
          <List>
            {statusData.details.map((detail, index) => (
              <List.Item key={index}>{detail}</List.Item>
            ))}
          </List>
        </>
      }
    >
      <Text c={statusData.color} fw={statusData.color !== "green" ? 700 : 400}>
        GPS
      </Text>
    </Tooltip>
  )
}
