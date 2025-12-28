import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "../store"

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

const initialState = {
  vehicleSysIds: [] as number[],
  vehicleColors: {} as { [key: number]: string },
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
    addVehicles: (state, action: PayloadAction<number[]>) => {
      state.vehicleSysIds.push(...action.payload)
      state.vehicleSysIds.sort((a, b) => a - b)
      action.payload.forEach((id) => {
        state.vehicleColors[id] = vehicleColorsMap[id % vehicleColorsMap.length]
      })
    },
    addVehicle: (state, action: PayloadAction<number>) => {
      state.vehicleSysIds.push(action.payload)
      state.vehicleSysIds.sort((a, b) => a - b)
      state.vehicleColors[action.payload] =
        vehicleColorsMap[action.payload % vehicleColorsMap.length]
    },
    removeVehicles: (state) => {
      state.vehicleSysIds = []
      state.vehicleColors = {}
    },
    removeVehicle: (state, action: PayloadAction<number>) => {
      state.vehicleSysIds = state.vehicleSysIds.filter(
        (id) => id !== action.payload,
      )
      delete state.vehicleColors[action.payload]
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
  },
  selectors: {
    selectVehicleSysIds: (state) => state.vehicleSysIds,
    selectVehicleColors: (state) => state.vehicleColors,
  },
})

export const {
  addVehicles,
  addVehicle,
  removeVehicles,
  removeVehicle,
  updateHeartbeatData,
  updateVfrHudData,
  updateGlobalPositionIntData,
  updateAttitudeData,
  updateBatteryStatusData,

  emitArmVehicle,
  emitDisarmVehicle,
} = vehiclesSlice.actions
export const { selectVehicleSysIds, selectVehicleColors } =
  vehiclesSlice.selectors

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
