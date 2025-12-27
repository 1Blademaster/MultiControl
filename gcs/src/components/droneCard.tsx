import { Button, Text } from "@mantine/core"
import { CopterMode } from "mavlink-mappings/dist/lib/ardupilotmega"
import { useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  emitArmVehicle,
  makeGetBatteryStatusData,
  makeGetFlightMode,
  makeGetGlobalPositionIntData,
  makeGetIsArmed,
  makeGetVfrHudData,
} from "../redux/slices/dronesSlice"
import { caToA, formatNumber, mmToM, mvToV } from "../utils/dataFormatters"

export default function DroneCard({
  sysId,
  color,
}: {
  sysId: number
  color: string
}) {
  const dispatch = useDispatch()
  const selectIsArmed = useMemo(() => makeGetIsArmed(sysId), [sysId])
  const selectFlightMode = useMemo(() => makeGetFlightMode(sysId), [sysId])
  const selectVfrHudData = useMemo(() => makeGetVfrHudData(sysId), [sysId])
  const selectGlobalPositionIntData = useMemo(
    () => makeGetGlobalPositionIntData(sysId),
    [sysId],
  )
  const selectBatteryStatusData = useMemo(
    () => makeGetBatteryStatusData(sysId),
    [sysId],
  )

  const isArmed = useSelector(selectIsArmed)
  const flightMode = useSelector(selectFlightMode)
  const vfrHudData = useSelector(selectVfrHudData)
  const globalPositionIntData = useSelector(selectGlobalPositionIntData)
  const batteryStatusData = useSelector(selectBatteryStatusData)

  return (
    <div className="w-120 bg-zinc-800/80 p-2 flex flex-col gap-4">
      <div className="flex flex-row gap-6 items-center">
        <Text fw={700} c={color} size="xl">
          Drone {sysId}
        </Text>
        <Text fw={700} size="xl" c={isArmed ? "red" : ""}>
          {isArmed ? "ARMED" : "DISARMED"}
        </Text>
        <Text size="xl">{CopterMode[flightMode]}</Text>
      </div>
      <div className="flex flex-row gap-6">
        <div className="flex flex-col">
          <Text size="lg">
            ALT: {formatNumber(mmToM(globalPositionIntData?.relative_alt))}
          </Text>
          <Text size="lg">GS: {formatNumber(vfrHudData?.groundSpeed)}</Text>
        </div>
        <div className="flex flex-col">
          <Text size="lg">
            BATT VOLT: {formatNumber(mvToV(batteryStatusData?.voltage))}
          </Text>
          <Text size="lg">
            BATT CURR: {formatNumber(caToA(batteryStatusData?.current))}
          </Text>
        </div>
      </div>
      <div className="w-full flex flex-row gap-2">
        <Button
          variant="light"
          color="red"
          radius={0}
          size="compact-md"
          onClick={() =>
            dispatch(emitArmVehicle({ system_id: sysId, force: false }))
          }
        >
          {isArmed ? "DISARM" : "ARM"}
        </Button>
        <Button variant="light" radius={0} size="compact-md">
          GUIDED
        </Button>
        <Button variant="light" radius={0} size="compact-md">
          AUTO
        </Button>
        <Button variant="light" radius={0} size="compact-md">
          RTL
        </Button>
      </div>
    </div>
  )
}
