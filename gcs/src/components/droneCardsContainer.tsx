import { useSelector } from "react-redux"
import {
  selectDroneColors,
  selectDroneSysIds,
} from "../redux/slices/dronesSlice"
import DroneCard from "./droneCard"

export default function DroneCardsContainer() {
  const droneSysIds = useSelector(selectDroneSysIds)
  const droneColors = useSelector(selectDroneColors)

  return (
    <div className="absolute top-14 left-0 pointer-events-none p-2 flex flex-col gap-2">
      {droneSysIds.map((sysId) => (
        <DroneCard key={sysId} sysId={sysId} color={droneColors[sysId]} />
      ))}
    </div>
  )
}
