import { Button, Select } from "@mantine/core"
import { useState } from "react"
import { useDispatch } from "react-redux"
import {
  emitSetVehicleFlightMode,
  VehicleType,
} from "../redux/slices/vehiclesSlice"
import { getFlightModesMap } from "../utils/mavlinkUtils"

function getFlightModesMapForVehicleType(vehicleType: VehicleType): {
  value: string
  label: string
}[] {
  const flightModesMap = getFlightModesMap(vehicleType)
  return Object.entries(flightModesMap)
    .map(([key, value]) => {
      if (typeof key === "string" && isNaN(Number(key))) {
        return {
          value: value.toString(),
          label: key,
        }
      } else {
        return null
      }
    })
    .filter((item): item is { value: string; label: string } => item !== null)
}

export default function NewFlightModeSelect({
  sysId,
  vehicleType,
}: {
  sysId: number
  vehicleType: VehicleType
}) {
  const dispatch = useDispatch()
  const [selectedMode, setSelectedMode] = useState<string | null>("0")

  function setNewFlightMode() {
    if (selectedMode && Number(selectedMode) >= 0) {
      dispatch(
        emitSetVehicleFlightMode({
          system_id: sysId,
          flight_mode: Number(selectedMode),
        }),
      )
    }
  }

  return (
    <div className="flex flex-row gap-2">
      <Select
        radius={0}
        data={getFlightModesMapForVehicleType(vehicleType)}
        allowDeselect={false}
        value={selectedMode}
        onChange={setSelectedMode}
      />
      <Button
        variant="light"
        size="compact-md"
        radius={0}
        onClick={setNewFlightMode}
      >
        Set Mode
      </Button>
    </div>
  )
}
