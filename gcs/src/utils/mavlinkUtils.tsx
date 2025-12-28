import {
  CopterMode,
  PlaneMode,
  RoverMode,
  SubMode,
  TrackerMode,
} from "mavlink-mappings/dist/lib/ardupilotmega"
import { VehicleType } from "../redux/slices/vehiclesSlice"

export const getFlightModesMap = (
  vehicleType: VehicleType,
):
  | typeof CopterMode
  | typeof PlaneMode
  | typeof RoverMode
  | typeof TrackerMode
  | typeof SubMode => {
  switch (vehicleType) {
    case VehicleType.COPTER:
      return CopterMode
    case VehicleType.PLANE:
      return PlaneMode
    case VehicleType.ROVER:
      return RoverMode
    case VehicleType.BOAT:
      // Boat goes to rover for the time being (according to pymavlink)
      return RoverMode
    case VehicleType.TRACKER:
      return TrackerMode
    case VehicleType.SUB:
      return SubMode
    default:
      // Return copter mode map by default
      return CopterMode
  }
}
