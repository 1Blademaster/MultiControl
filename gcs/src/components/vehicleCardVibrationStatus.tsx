import { List, Text, Tooltip } from "@mantine/core"
import { useMemo } from "react"
import { useSelector } from "react-redux"
import { makeGetVibrationData } from "../redux/slices/vehiclesSlice"
import { formatNumber } from "../utils/dataFormatters"

export default function VehicleCardVibrationStatus({
  sysId,
}: {
  sysId: number
}) {
  const selectVibrationData = useMemo(
    () => makeGetVibrationData(sysId),
    [sysId],
  )

  const vibrationData = useSelector(selectVibrationData)

  const statusData: { color: string; details: string[] } | null =
    useMemo(() => {
      if (!vibrationData) return null

      const details: string[] = []
      let color: "green" | "orange" | "red" = "green"

      const updateColor = (newColor: "green" | "orange" | "red") => {
        const severity = { green: 0, orange: 1, red: 2 }
        if (severity[newColor] > severity[color]) {
          color = newColor
        }
      }

      // Vibration thresholds (in m/s/s)
      const VIBRATION_WARN_THRESHOLD = 30
      const VIBRATION_ERROR_THRESHOLD = 60

      const vibeX = vibrationData.vibration_x
      if (vibeX > VIBRATION_ERROR_THRESHOLD) {
        updateColor("red")
      } else if (vibeX > VIBRATION_WARN_THRESHOLD) {
        updateColor("orange")
      }
      details.push(`Vibration X: ${formatNumber(vibeX)} m/s/s`)

      const vibeY = vibrationData.vibration_y
      if (vibeY > VIBRATION_ERROR_THRESHOLD) {
        updateColor("red")
      } else if (vibeY > VIBRATION_WARN_THRESHOLD) {
        updateColor("orange")
      }
      details.push(`Vibration Y: ${formatNumber(vibeY)} m/s/s`)

      const vibeZ = vibrationData.vibration_z
      if (vibeZ > VIBRATION_ERROR_THRESHOLD) {
        updateColor("red")
      } else if (vibeZ > VIBRATION_WARN_THRESHOLD) {
        updateColor("orange")
      }
      details.push(`Vibration Z: ${formatNumber(vibeZ)} m/s/s`)

      // Check for clipping (clipping indicates accelerometer saturation)
      const totalClipping =
        vibrationData.clipping_0 +
        vibrationData.clipping_1 +
        vibrationData.clipping_2

      details.push(
        `Clipping: [${vibrationData.clipping_0}, ${vibrationData.clipping_1}, ${vibrationData.clipping_2}]`,
      )

      if (totalClipping > 0) {
        updateColor("red")
      }

      return { color, details }
    }, [vibrationData])

  if (statusData === null) {
    return <Text>VIBE</Text>
  }

  return (
    <Tooltip
      label={
        <>
          <Text>Vibration Status:</Text>
          <List>
            {statusData.details.map((detail, index) => (
              <List.Item key={index}>{detail}</List.Item>
            ))}
          </List>
        </>
      }
      color="dark"
      className="cursor-pointer"
    >
      <Text c={statusData.color} fw={statusData.color !== "green" ? 700 : 400}>
        VIBE
      </Text>
    </Tooltip>
  )
}
