import { List, Text, Tooltip } from "@mantine/core"
import { MavSysStatusSensor } from "mavlink-mappings/dist/lib/common"
import { useMemo } from "react"
import { useSelector } from "react-redux"
import { makeGetSystemStatusData } from "../redux/slices/vehiclesSlice"

export default function VehicleCardSensorStatus({ sysId }: { sysId: number }) {
  const selectSystemStatusData = useMemo(
    () => makeGetSystemStatusData(sysId),
    [sysId],
  )

  const systemStatusData = useSelector(selectSystemStatusData)

  const statusData: { color: string; details: string[] } | null =
    useMemo(() => {
      if (!systemStatusData) return null

      const onboard_control_sensors_enabled =
        systemStatusData.onboard_control_sensors_enabled
      const onboard_control_sensors_health =
        systemStatusData.onboard_control_sensors_health

      const unhealthySensors: string[] = []

      // Check each sensor bit
      Object.entries(MavSysStatusSensor).forEach(([sensorName, sensorBit]) => {
        // Skip if not a number (enum values can be strings too)
        if (typeof sensorBit !== "number") return

        // Check if sensor is enabled
        const isEnabled = (onboard_control_sensors_enabled & sensorBit) !== 0
        // Check if sensor is healthy
        const isHealthy = (onboard_control_sensors_health & sensorBit) !== 0

        // If sensor is enabled but not healthy, add it to unhealthy list
        if (isEnabled && !isHealthy) {
          unhealthySensors.push(sensorName)
        }
      })

      const color = unhealthySensors.length > 0 ? "red" : "green"
      const details = unhealthySensors

      return { color, details }
    }, [systemStatusData])

  if (statusData === null) {
    return <Text>SENSORS</Text>
  }

  return (
    <Tooltip
      label={
        <>
          {statusData.details.length > 0 ? (
            <>
              <Text>Unhealthy Sensors:</Text>
              <List>
                {statusData.details.map((detail, index) => (
                  <List.Item key={index}>{detail}</List.Item>
                ))}
              </List>
            </>
          ) : (
            <Text>All sensors healthy</Text>
          )}
        </>
      }
      color="dark"
      className="cursor-pointer"
    >
      <Text c={statusData.color} fw={!statusData.details.length ? 400 : 700}>
        SENSORS
      </Text>
    </Tooltip>
  )
}
