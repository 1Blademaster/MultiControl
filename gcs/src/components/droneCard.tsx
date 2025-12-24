import { Text } from "@mantine/core"
import { useMemo } from "react"
import { useSelector } from "react-redux"
import {
  makeGetFlightMode,
  makeGetGlobalPositionIntData,
  makeGetIsArmed,
  makeGetVfrHudData,
} from "../redux/slices/dronesSlice"
import { formatNumber, mToM } from "../utils/dataFormatters"

export default function DroneCard({
  sysId,
  color,
}: {
  sysId: number
  color: string
}) {
  const selectIsArmed = useMemo(() => makeGetIsArmed(sysId), [sysId])
  const selectFlightMode = useMemo(() => makeGetFlightMode(sysId), [sysId])
  const selectVfrHudData = useMemo(() => makeGetVfrHudData(sysId), [sysId])
  const selectGlobalPositionIntData = useMemo(
    () => makeGetGlobalPositionIntData(sysId),
    [sysId],
  )

  const isArmed = useSelector(selectIsArmed)
  const flightMode = useSelector(selectFlightMode)
  const vfrHudData = useSelector(selectVfrHudData)
  const globalPositionIntData = useSelector(selectGlobalPositionIntData)

  return (
    <div className="w-120 h-52 bg-zinc-800/80 p-2">
      <Text c={color}>Drone {sysId}</Text>
      <Text>{isArmed ? "Armed" : "Disarmed"}</Text>
      <Text>{flightMode}</Text>
      <Text>Alt (MSL): {formatNumber(vfrHudData?.alt)}</Text>
      <Text>
        Alt (Rel): {formatNumber(mToM(globalPositionIntData?.relative_alt))}
      </Text>
      <Text>Ground Speed: {formatNumber(vfrHudData?.groundSpeed)}</Text>
    </div>
  )
}
