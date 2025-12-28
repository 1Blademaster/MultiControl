import { Button, Text } from "@mantine/core"
import { CopterMode } from "mavlink-mappings/dist/lib/ardupilotmega"
import { useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  emitArmVehicle,
  emitDisarmVehicle,
  makeGetBatteryStatusData,
  makeGetFlightMode,
  makeGetGlobalPositionIntData,
  makeGetIsArmed,
  makeGetVfrHudData,
  VehicleType,
} from "../redux/slices/vehiclesSlice"
import { caToA, formatNumber, mmToM, mvToV } from "../utils/dataFormatters"

export default function VehicleCard({
  sysId,
  color,
  vehicleType,
}: {
  sysId: number
  color: string
  vehicleType: VehicleType
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

  function handleArmDisarm() {
    if (isArmed) {
      dispatch(emitDisarmVehicle({ system_id: sysId, force: false }))
    } else {
      dispatch(emitArmVehicle({ system_id: sysId, force: false }))
    }
  }

  return (
    <div className="w-120 bg-zinc-800/80 p-2 flex flex-col gap-4">
      <div className="flex flex-row gap-6 items-center">
        <Text fw={700} c={color} size="xl">
          Vehicle {sysId}
        </Text>
        <Text fw={700} size="xl" c={isArmed ? "red" : ""}>
          {isArmed ? "ARMED" : "DISARMED"}
        </Text>
        <Text size="xl">{CopterMode[flightMode]}</Text>
        <Text size="xl">{vehicleType}</Text>
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
          onClick={handleArmDisarm}
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
