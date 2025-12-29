import { Button, Text } from "@mantine/core"
import { useDispatch } from "react-redux"
import {
  emitArmAllVehicles,
  emitDisarmAllVehicles,
} from "../redux/slices/vehiclesSlice"

export default function ControlBar() {
  const dispatch = useDispatch()
  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-content mx-auto bg-zinc-800/80 flex flex-col gap-2 p-2">
      <Text ta="center">Actions for all vehicles</Text>
      <div className="flex flex-row items-center gap-2">
        <Button
          variant="light"
          color="red"
          radius={0}
          size="compact-md"
          onClick={() => dispatch(emitArmAllVehicles({ force: false }))}
        >
          ARM
        </Button>
        <Button
          variant="light"
          color="red"
          radius={0}
          size="compact-md"
          onClick={() => dispatch(emitDisarmAllVehicles({ force: false }))}
        >
          DISARM
        </Button>
        <Button variant="light" radius={0} size="compact-md">
          Takeoff
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
