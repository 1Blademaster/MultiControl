import { ScrollArea } from "@mantine/core"
import { useSelector } from "react-redux"
import {
  selectVehicleColors,
  selectVehicleSysIds,
  selectVehicleTypes,
} from "../redux/slices/vehiclesSlice"
import VehicleCard from "./vehicleCard"

export default function VehicleCardsContainer() {
  const vehicleSysIds = useSelector(selectVehicleSysIds)
  const vehicleColors = useSelector(selectVehicleColors)
  const vehicleTypes = useSelector(selectVehicleTypes)

  return (
    <div
      className="absolute top-14 left-0 p-2"
      style={{ height: "calc(100vh - 3.5rem)" }}
    >
      <ScrollArea h="100%">
        <div className="flex flex-col gap-2">
          {vehicleSysIds.map((sysId) => (
            <VehicleCard
              key={sysId}
              sysId={sysId}
              color={vehicleColors[sysId]}
              vehicleType={vehicleTypes[sysId]}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
