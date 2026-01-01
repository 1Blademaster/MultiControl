import { Button, Text } from "@mantine/core"
import { useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  emitArmVehicle,
  emitDisarmVehicle,
  emitSetVehicleFlightMode,
  makeGetBatteryStatusData,
  makeGetFlightMode,
  makeGetGlobalPositionIntData,
  makeGetIsArmed,
  makeGetVfrHudData,
  VehicleType,
} from "../redux/slices/vehiclesSlice"
import { caToA, formatNumber, mmToM, mvToV } from "../utils/dataFormatters"
import { getFlightModesMap } from "../utils/mavlinkUtils"
import NewFlightModeSelect from "./newFlightModeSelect"
import VehicleCardEkfStatus from "./vehicleCardEkfStatus"
import VehicleCardGpsStatus from "./vehicleCardGpsStatus"
import VehicleCardSensorStatus from "./vehicleCardSensorStatus"
import VehicleCardVibrationStatus from "./vehicleCardVibrationStatus"
import VehicleIcon from "./vehicleIcon"

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
  const flightModesMap = useMemo<Record<number, string>>(
    () => getFlightModesMap(vehicleType),
    [vehicleType],
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

  function handleSetFlightMode(newFlightMode: string) {
    const newFlightModeNumber = Object.entries(flightModesMap).find(
      ([, value]) => value === newFlightMode,
    )?.[0]

    if (newFlightModeNumber !== undefined) {
      dispatch(
        emitSetVehicleFlightMode({
          system_id: sysId,
          flight_mode: Number(newFlightModeNumber),
        }),
      )
    }
  }

  return (
    <div className="w-120 bg-zinc-800/80 p-2 flex flex-col gap-4">
      <div className="flex flex-row gap-6 items-center cursor-default">
        <div className="flex flex-row gap-1 items-center">
          <Text fw={700} c={color} size="xl">
            Vehicle {sysId}
          </Text>
          <VehicleIcon vehicleType={vehicleType} color={color} />
        </div>
        <Text fw={700} size="xl" c={isArmed ? "red" : ""}>
          {isArmed ? "ARMED" : "DISARMED"}
        </Text>
        <Text size="xl">{flightModesMap[flightMode]}</Text>
      </div>
      <div className="flex flex-row gap-6 cursor-default">
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
      <div className="flex flex-row gap-2 cursor-default">
        <VehicleCardSensorStatus sysId={sysId} />
        <VehicleCardGpsStatus sysId={sysId} />
        <VehicleCardVibrationStatus sysId={sysId} />
        <VehicleCardEkfStatus sysId={sysId} />
      </div>
      <div className="w-full flex flex-row flex-wrap gap-2">
        <Button
          variant="light"
          color="red"
          radius={0}
          size="compact-md"
          onClick={handleArmDisarm}
        >
          {isArmed ? "DISARM" : "ARM"}
        </Button>
        <Button
          variant="light"
          radius={0}
          size="compact-md"
          onClick={() => handleSetFlightMode("GUIDED")}
        >
          GUIDED
        </Button>
        <Button
          variant="light"
          radius={0}
          size="compact-md"
          onClick={() => handleSetFlightMode("AUTO")}
        >
          AUTO
        </Button>
        <Button
          variant="light"
          radius={0}
          size="compact-md"
          onClick={() => handleSetFlightMode("RTL")}
        >
          RTL
        </Button>
        <NewFlightModeSelect sysId={sysId} vehicleType={vehicleType} />
      </div>
    </div>
  )
}
