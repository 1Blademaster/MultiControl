import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "../store"

export enum VehicleType {
  UNKNOWN = "unknown",
  COPTER = "copter",
  PLANE = "plane",
  ROVER = "rover",
  BOAT = "boat",
  TRACKER = "tracker",
  SUB = "sub",
  BLIMP = "blimp",
}

export type StatusTextMessageRecord = {
  system_id: number
  text: string
  severity: number
  timestamp: number
}

type HeartbeatRecord = {
  system_id: number
  type: number
  autopilot: number
  base_mode: number
  custom_mode: number
  system_status: number
}

type VfrHudRecord = {
  system_id: number
  heading: number
  alt: number
  groundSpeed: number
  climb: number
}

type GlobalPositionIntRecord = {
  system_id: number
  lat: number
  lon: number
  alt: number
  relative_alt: number
  hdg: number
}

type AttitudeDataRecord = {
  system_id: number
  pitch: number
  roll: number
  yaw: number
}

type BatteryStatusDataRecord = {
  system_id: number
  voltage: number
  current: number
  current_consumed: number
  battery_remaining: number
}

interface ArmDisarmVehiclePayload {
  system_id: number
  force: boolean
}

interface SetFlightModePayload {
  system_id: number
  flight_mode: number
}

const initialState = {
  vehicleSysIds: [] as number[],
  vehicleTypes: {} as { [key: number]: VehicleType },
  vehicleColors: {} as { [key: number]: string },
  statusTextMessages: [] as StatusTextMessageRecord[],
  heartbeatData: {} as { [key: number]: HeartbeatRecord },
  vfrHudData: {} as { [key: number]: VfrHudRecord },
  globalPositionIntData: {} as { [key: number]: GlobalPositionIntRecord },
  attitudeData: {} as { [key: number]: AttitudeDataRecord },
  batteryStatusData: {} as { [key: number]: BatteryStatusDataRecord },
}

const MAV_MODE_FLAG_SAFETY_ARMED = 128

const vehicleColorsMap = [
  "#dc2626",
  "#f59e0b",
  "#d946ef",
  "#4ade80",
  "#9333ea",
  "#2dd4bf",
  "#6366f1",
  "#0ea5e9",
  "#22d3ee",
  "#60a5fa",
  "#059669",
  "#a78bfa",
  "#84cc16",
  "#f472b6",
  "#f97316",
]

const vehiclesSlice = createSlice({
  name: "vehicles",
  initialState,
  reducers: {
    addVehicles: (
      state,
      action: PayloadAction<{ system_id: number; vehicle_type: VehicleType }[]>,
    ) => {
      state.vehicleSysIds.push(...action.payload.map((v) => v.system_id))
      state.vehicleSysIds.sort((a, b) => a - b)
      action.payload.forEach((v) => {
        state.vehicleColors[v.system_id] =
          vehicleColorsMap[v.system_id % vehicleColorsMap.length]
        state.vehicleTypes[v.system_id] = v.vehicle_type
      })
    },
    addVehicle: (
      state,
      action: PayloadAction<{ system_id: number; vehicle_type: VehicleType }>,
    ) => {
      state.vehicleSysIds.push(action.payload.system_id)
      state.vehicleSysIds.sort((a, b) => a - b)
      state.vehicleColors[action.payload.system_id] =
        vehicleColorsMap[action.payload.system_id % vehicleColorsMap.length]
      state.vehicleTypes[action.payload.system_id] = action.payload.vehicle_type
    },
    removeVehicles: (state) => {
      state.vehicleSysIds = []
      state.vehicleColors = {}
      state.vehicleTypes = {}
    },
    removeVehicle: (state, action: PayloadAction<{ system_id: number }>) => {
      state.vehicleSysIds = state.vehicleSysIds.filter(
        (id) => id !== action.payload.system_id,
      )
      delete state.vehicleColors[action.payload.system_id]
      delete state.vehicleTypes[action.payload.system_id]
    },
    appendToStatusTextMessages: (
      state,
      action: PayloadAction<StatusTextMessageRecord>,
    ) => {
      // Add to start of array to show latest messages first
      state.statusTextMessages.unshift(action.payload)
    },
    clearStatusTextMessages: (state) => {
      state.statusTextMessages = []
    },
    updateHeartbeatData: (state, action: PayloadAction<HeartbeatRecord>) => {
      const data = action.payload
      state.heartbeatData[data.system_id] = data
    },
    updateVfrHudData: (state, action: PayloadAction<VfrHudRecord>) => {
      const data = action.payload
      state.vfrHudData[data.system_id] = data
    },
    updateGlobalPositionIntData: (
      state,
      action: PayloadAction<GlobalPositionIntRecord>,
    ) => {
      const data = action.payload
      state.globalPositionIntData[data.system_id] = data
    },
    updateAttitudeData: (state, action: PayloadAction<AttitudeDataRecord>) => {
      const data = action.payload
      state.attitudeData[data.system_id] = data
    },
    updateBatteryStatusData: (
      state,
      action: PayloadAction<BatteryStatusDataRecord>,
    ) => {
      const data = action.payload
      state.batteryStatusData[data.system_id] = data
    },

    emitArmVehicle: (
      _state,
      _action: PayloadAction<ArmDisarmVehiclePayload>,
    ) => {},
    emitDisarmVehicle: (
      _state,
      _action: PayloadAction<ArmDisarmVehiclePayload>,
    ) => {},
    emitSetVehicleFlightMode: (
      _state,
      _action: PayloadAction<SetFlightModePayload>,
    ) => {},
  },
  selectors: {
    selectVehicleSysIds: (state) => state.vehicleSysIds,
    selectVehicleTypes: (state) => state.vehicleTypes,
    selectVehicleColors: (state) => state.vehicleColors,
    selectStatusTextMessages: (state) => state.statusTextMessages,
  },
})

export const {
  addVehicles,
  addVehicle,
  removeVehicles,
  removeVehicle,
  appendToStatusTextMessages,
  clearStatusTextMessages,
  updateHeartbeatData,
  updateVfrHudData,
  updateGlobalPositionIntData,
  updateAttitudeData,
  updateBatteryStatusData,

  emitArmVehicle,
  emitDisarmVehicle,
  emitSetVehicleFlightMode,
} = vehiclesSlice.actions
export const {
  selectVehicleSysIds,
  selectVehicleTypes,
  selectVehicleColors,
  selectStatusTextMessages,
} = vehiclesSlice.selectors

// Memoized selector factories
export const makeGetIsArmed = (vehicleSysId: number) =>
  createSelector(
    [(state: RootState) => state.vehicles.heartbeatData[vehicleSysId]],
    (heartbeat) => !!(heartbeat?.base_mode & MAV_MODE_FLAG_SAFETY_ARMED),
  )

export const makeGetFlightMode = (vehicleSysId: number) =>
  createSelector(
    [(state: RootState) => state.vehicles.heartbeatData[vehicleSysId]],
    (heartbeat) => heartbeat?.custom_mode,
  )

export const makeGetVfrHudData = (vehicleSysId: number) => (state: RootState) =>
  state.vehicles.vfrHudData[vehicleSysId]

export const makeGetGlobalPositionIntData =
  (vehicleSysId: number) => (state: RootState) =>
    state.vehicles.globalPositionIntData[vehicleSysId]

export const makeGetAttitudeData =
  (vehicleSysId: number) => (state: RootState) =>
    state.vehicles.attitudeData[vehicleSysId]

export const makeGetBatteryStatusData =
  (vehicleSysId: number) => (state: RootState) =>
    state.vehicles.batteryStatusData[vehicleSysId]

export default vehiclesSlice
