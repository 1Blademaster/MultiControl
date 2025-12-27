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

const initialState = {
  droneSysIds: [] as number[],
  droneColors: {} as { [key: number]: string },
  heartbeatData: {} as { [key: number]: HeartbeatRecord },
  vfrHudData: {} as { [key: number]: VfrHudRecord },
  globalPositionIntData: {} as { [key: number]: GlobalPositionIntRecord },
  attitudeData: {} as { [key: number]: AttitudeDataRecord },
  batteryStatusData: {} as { [key: number]: BatteryStatusDataRecord },
}

const MAV_MODE_FLAG_SAFETY_ARMED = 128

const droneColorsMap = [
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

const dronesSlice = createSlice({
  name: "drones",
  initialState,
  reducers: {
    addDrones: (state, action: PayloadAction<number[]>) => {
      state.droneSysIds.push(...action.payload)
      state.droneSysIds.sort((a, b) => a - b)
      action.payload.forEach((id) => {
        state.droneColors[id] = droneColorsMap[id % droneColorsMap.length]
      })
    },
    addDrone: (state, action: PayloadAction<number>) => {
      state.droneSysIds.push(action.payload)
      state.droneSysIds.sort((a, b) => a - b)
      state.droneColors[action.payload] =
        droneColorsMap[action.payload % droneColorsMap.length]
    },
    removeDrones: (state) => {
      state.droneSysIds = []
      state.droneColors = {}
    },
    removeDrone: (state, action: PayloadAction<number>) => {
      state.droneSysIds = state.droneSysIds.filter(
        (id) => id !== action.payload,
      )
      delete state.droneColors[action.payload]
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
  },
  selectors: {
    selectDroneSysIds: (state) => state.droneSysIds,
    selectDroneColors: (state) => state.droneColors,
  },
})

export const {
  addDrones,
  addDrone,
  removeDrones,
  removeDrone,
  updateHeartbeatData,
  updateVfrHudData,
  updateGlobalPositionIntData,
  updateAttitudeData,
  updateBatteryStatusData,
} = dronesSlice.actions
export const { selectDroneSysIds, selectDroneColors } = dronesSlice.selectors

// Memoized selector factories
export const makeGetIsArmed = (droneSysId: number) =>
  createSelector(
    [(state: RootState) => state.drones.heartbeatData[droneSysId]],
    (heartbeat) => !!(heartbeat?.base_mode & MAV_MODE_FLAG_SAFETY_ARMED),
  )

export const makeGetFlightMode = (droneSysId: number) =>
  createSelector(
    [(state: RootState) => state.drones.heartbeatData[droneSysId]],
    (heartbeat) => heartbeat?.custom_mode,
  )

export const makeGetVfrHudData = (droneSysId: number) => (state: RootState) =>
  state.drones.vfrHudData[droneSysId]

export const makeGetGlobalPositionIntData =
  (droneSysId: number) => (state: RootState) =>
    state.drones.globalPositionIntData[droneSysId]

export const makeGetAttitudeData = (droneSysId: number) => (state: RootState) =>
  state.drones.attitudeData[droneSysId]

export const makeGetBatteryStatusData =
  (droneSysId: number) => (state: RootState) =>
    state.drones.batteryStatusData[droneSysId]

export default dronesSlice
