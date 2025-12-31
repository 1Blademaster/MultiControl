import { List, Text, Tooltip } from "@mantine/core"
import { EstimatorStatusFlags } from "mavlink-mappings/dist/lib/common"
import { useMemo } from "react"
import { useSelector } from "react-redux"
import {
  makeGetEkfStatusReportData,
  makeGetGpsRawIntData,
} from "../redux/slices/vehiclesSlice"
import { formatNumber } from "../utils/dataFormatters"

// Helper to get active EKF flags from the flags bitmask
const getActiveEKFFlags = (flags: number): string[] => {
  const activeFlags: string[] = []
  Object.entries(EstimatorStatusFlags).forEach(([flagName, flagValue]) => {
    if (typeof flagValue === "number" && flags & flagValue) {
      activeFlags.push(flagName)
    }
  })
  return activeFlags
}

export default function VehicleCardEkfStatus({ sysId }: { sysId: number }) {
  const selectEkfStatusReportData = useMemo(
    () => makeGetEkfStatusReportData(sysId),
    [sysId],
  )
  const selectGpsRawIntData = useMemo(
    () => makeGetGpsRawIntData(sysId),
    [sysId],
  )

  const ekfStatusReportData = useSelector(selectEkfStatusReportData)
  const gpsRawIntData = useSelector(selectGpsRawIntData)

  const statusData: { color: string; details: string[] } | null =
    useMemo(() => {
      if (!ekfStatusReportData) return null

      const details: string[] = []
      let color: "green" | "orange" | "red" = "green"

      const updateColor = (newColor: "green" | "orange" | "red") => {
        const severity = { green: 0, orange: 1, red: 2 }
        if (severity[newColor] > severity[color]) {
          color = newColor
        }
      }

      // Calculate EKF status value ranging from 0-1
      // Based on ArduPilot MissionPlanner implementation
      // https://github.com/ArduPilot/MissionPlanner/blob/4d441bd4b1dbc08adce4d8b26e078e93760da3a7/ExtLibs/ArduPilot/CurrentState.cs#L2645-L2647
      const vel = ekfStatusReportData.velocity_variance
      const comp = ekfStatusReportData.compass_variance
      const posHor = ekfStatusReportData.pos_horiz_variance
      const posVer = ekfStatusReportData.pos_vert_variance
      const terAlt = ekfStatusReportData.terrain_alt_variance
      let ekfCalculatedStatus = Math.max(vel, comp, posHor, posVer, terAlt)

      // Check EKF flags to handle critical errors
      const activeFlags = getActiveEKFFlags(ekfStatusReportData.flags)

      if (!activeFlags.includes("ATTITUDE")) {
        // If we have no attitude solution
        ekfCalculatedStatus = 1
        details.push("No attitude solution")
      } else if (!activeFlags.includes("VELOCITY_HORIZ")) {
        // If we have GPS but no horizontal velocity solution
        const gpsFixType = gpsRawIntData?.fix_type ?? 0
        if (gpsFixType > 0) {
          ekfCalculatedStatus = 1
          details.push("No horizontal velocity solution")
        }
      } else if (activeFlags.includes("CONST_POS_MODE")) {
        // EKF in constant position mode (not ideal)
        details.push("Constant position mode")
      }

      if (ekfCalculatedStatus >= 0.5) {
        // Add variance details if they contribute to high status
        if (vel >= ekfCalculatedStatus * 0.5) {
          details.push(`Velocity var: ${formatNumber(vel)}`)
        }
        if (comp >= ekfCalculatedStatus * 0.5) {
          details.push(`Compass var: ${formatNumber(comp)}`)
        }
        if (posHor >= ekfCalculatedStatus * 0.5) {
          details.push(`Horiz pos var: ${formatNumber(posHor)}`)
        }
        if (posVer >= ekfCalculatedStatus * 0.5) {
          details.push(`Vert pos var: ${formatNumber(posVer)}`)
        }
        if (terAlt >= ekfCalculatedStatus * 0.5) {
          details.push(`Terrain alt var: ${formatNumber(terAlt)}`)
        }
      }

      // Determine color based on calculated status (0-1 range)
      if (ekfCalculatedStatus >= 0.8) {
        updateColor("red")
      } else if (ekfCalculatedStatus >= 0.5) {
        updateColor("orange")
      } else {
        updateColor("green")
      }

      return { color, details }
    }, [ekfStatusReportData, gpsRawIntData])

  if (statusData === null) {
    return <Text>EKF</Text>
  }

  return (
    <Tooltip
      disabled={!statusData.details.length}
      label={
        <>
          <Text>EKF Issues:</Text>
          <List>
            {statusData.details.map((detail, index) => (
              <List.Item key={index}>{detail}</List.Item>
            ))}
          </List>
        </>
      }
    >
      <Text c={statusData.color} fw={statusData.color !== "green" ? 700 : 400}>
        EKF
      </Text>
    </Tooltip>
  )
}
