import { ScrollArea } from "@mantine/core"
import { useSelector } from "react-redux"
import {
  selectDroneColors,
  selectDroneSysIds,
} from "../redux/slices/dronesSlice"
import DroneCard from "./droneCard"

export default function DroneCardsContainer() {
  const droneSysIds = useSelector(selectDroneSysIds)
  const droneColors = useSelector(selectDroneColors)

  console.log(droneSysIds)

  return (
    <div
      className="absolute top-14 left-0 p-2"
      style={{ height: "calc(100vh - 3.5rem)" }}
    >
      <ScrollArea h="100%">
        <div className="flex flex-col gap-2">
          {droneSysIds.map((sysId) => (
            <DroneCard key={sysId} sysId={sysId} color={droneColors[sysId]} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
