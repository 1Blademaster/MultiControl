import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { intToCoord } from "../../utils/dataFormatters"
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

interface SystemStatusDataRecord {
  system_id: number
  onboard_control_sensors_enabled: number
  onboard_control_sensors_health: number
}

interface GpsRawIntDataRecord {
  system_id: number
  fix_type: number
  eph: number
  epv: number
  satellites_visible: number
}

interface VibrationDataRecord {
  system_id: number
  vibration_x: number
  vibration_y: number
  vibration_z: number
  clipping_0: number
  clipping_1: number
  clipping_2: number
}

interface EkfStatusReportDataRecord {
  system_id: number
  flags: number
  velocity_variance: number
  pos_horiz_variance: number
  pos_vert_variance: number
  compass_variance: number
  terrain_alt_variance: number
}

interface ArmDisarmVehiclePayload {
  system_id: number
  force: boolean
}

interface ArmDisarmAllVehiclesPayload {
  force: boolean
}

interface SetFlightModePayload {
  system_id: number
  flight_mode: number
}

interface SetFlightModeAllVehiclesPayload {
  flight_mode: string
}

interface TargetPositionRecord {
  system_id: number
  lat: number
  lon: number
  altitude: number
}

interface GpsTrackPoint {
  lat: number
  lon: number
}

const MAX_TRACK_POINTS = 300

const initialState = {
  vehicleSysIds: [] as number[],
  vehicleTypes: {} as { [key: number]: VehicleType },
  vehicleColors: {} as { [key: number]: string },
  hoveredVehicleId: null as number | null,
  centeredVehicleId: null as number | null,
  followedVehicleId: null as number | null,
  statusTextMessages: [] as StatusTextMessageRecord[],
  heartbeatData: {} as { [key: number]: HeartbeatRecord },
  vfrHudData: {} as { [key: number]: VfrHudRecord },
  globalPositionIntData: {} as { [key: number]: GlobalPositionIntRecord },
  attitudeData: {} as { [key: number]: AttitudeDataRecord },
  batteryStatusData: {} as { [key: number]: BatteryStatusDataRecord },
  systemStatusData: {} as { [key: number]: SystemStatusDataRecord },
  gpsRawIntData: {} as { [key: number]: GpsRawIntDataRecord },
  vibrationData: {} as { [key: number]: VibrationDataRecord },
  ekfStatusReportData: {} as { [key: number]: EkfStatusReportDataRecord },
  targetPositions: {} as { [key: number]: TargetPositionRecord },
  gpsTracks: {} as { [key: number]: GpsTrackPoint[] },
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
      state.gpsTracks = {}
    },
    removeVehicle: (state, action: PayloadAction<{ system_id: number }>) => {
      state.vehicleSysIds = state.vehicleSysIds.filter(
        (id) => id !== action.payload.system_id,
      )
      delete state.vehicleColors[action.payload.system_id]
      delete state.vehicleTypes[action.payload.system_id]
      delete state.gpsTracks[action.payload.system_id]
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

      // Add point to GPS track
      const track = state.gpsTracks[data.system_id] || []
      const newPoint = {
        lat: intToCoord(data.lat),
        lon: intToCoord(data.lon),
      }

      // Only add if the point has changed (avoid duplicates)
      const lastPoint = track[track.length - 1]
      if (
        !lastPoint ||
        lastPoint.lat !== newPoint.lat ||
        lastPoint.lon !== newPoint.lon
      ) {
        track.push(newPoint)

        // Limit track to MAX_TRACK_POINTS
        if (track.length > MAX_TRACK_POINTS) {
          track.shift() // Remove oldest point
        }

        state.gpsTracks[data.system_id] = track
      }
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
    updateSystemStatusData: (
      state,
      action: PayloadAction<SystemStatusDataRecord>,
    ) => {
      const data = action.payload
      state.systemStatusData[data.system_id] = data
    },
    updateGpsRawIntData: (
      state,
      action: PayloadAction<GpsRawIntDataRecord>,
    ) => {
      const data = action.payload
      state.gpsRawIntData[data.system_id] = data
    },
    updateVibrationData: (
      state,
      action: PayloadAction<VibrationDataRecord>,
    ) => {
      const data = action.payload
      state.vibrationData[data.system_id] = data
    },
    updateEkfStatusReportData: (
      state,
      action: PayloadAction<EkfStatusReportDataRecord>,
    ) => {
      const data = action.payload
      state.ekfStatusReportData[data.system_id] = data
    },
    setHoveredVehicle: (state, action: PayloadAction<number | null>) => {
      state.hoveredVehicleId = action.payload
    },
    setCenteredVehicle: (state, action: PayloadAction<number | null>) => {
      state.centeredVehicleId = action.payload
    },
    setFollowedVehicle: (state, action: PayloadAction<number | null>) => {
      state.followedVehicleId = action.payload
    },
    setTargetPosition: (
      state,
      action: PayloadAction<{
        system_id: number
        lat: number
        lon: number
        altitude: number
      }>,
    ) => {
      state.targetPositions[action.payload.system_id] = {
        system_id: action.payload.system_id,
        lat: action.payload.lat,
        lon: action.payload.lon,
        altitude: action.payload.altitude,
      }
    },
    clearTargetPosition: (state, action: PayloadAction<number>) => {
      delete state.targetPositions[action.payload]
    },
    clearAllTargetPositions: (state) => {
      state.targetPositions = {}
    },

    emitArmVehicle: (
      _state,
      _action: PayloadAction<ArmDisarmVehiclePayload>,
    ) => {},
    emitArmAllVehicles: (
      _state,
      _action: PayloadAction<ArmDisarmAllVehiclesPayload>,
    ) => {},
    emitDisarmVehicle: (
      _state,
      _action: PayloadAction<ArmDisarmVehiclePayload>,
    ) => {},
    emitDisarmAllVehicles: (
      _state,
      _action: PayloadAction<ArmDisarmAllVehiclesPayload>,
    ) => {},
    emitSetVehicleFlightMode: (
      _state,
      _action: PayloadAction<SetFlightModePayload>,
    ) => {},
    emitSetAllVehiclesFlightMode: (
      _state,
      _action: PayloadAction<SetFlightModeAllVehiclesPayload>,
    ) => {},
  },
  selectors: {
    selectVehicleSysIds: (state) => state.vehicleSysIds,
    selectVehicleTypes: (state) => state.vehicleTypes,
    selectVehicleColors: (state) => state.vehicleColors,
    selectHoveredVehicleId: (state) => state.hoveredVehicleId,
    selectCenteredVehicleId: (state) => state.centeredVehicleId,
    selectFollowedVehicleId: (state) => state.followedVehicleId,
    selectStatusTextMessages: (state) => state.statusTextMessages,
    selectAllVehiclesLatLon: (state) => {
      return Object.values(state.globalPositionIntData).map((data) => ({
        lat: intToCoord(data.lat),
        lng: intToCoord(data.lon),
      }))
    },
    selectTargetPositions: (state) => state.targetPositions,
    selectGlobalPositionIntData: (state) => state.globalPositionIntData,
    selectGpsTracks: (state) => state.gpsTracks,
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
  updateSystemStatusData,
  updateGpsRawIntData,
  updateVibrationData,
  updateEkfStatusReportData,
  setHoveredVehicle,
  setCenteredVehicle,
  setFollowedVehicle,
  setTargetPosition,
  clearTargetPosition,
  clearAllTargetPositions,

  emitArmVehicle,
  emitArmAllVehicles,
  emitDisarmVehicle,
  emitDisarmAllVehicles,
  emitSetVehicleFlightMode,
  emitSetAllVehiclesFlightMode,
} = vehiclesSlice.actions
export const {
  selectVehicleSysIds,
  selectVehicleTypes,
  selectVehicleColors,
  selectHoveredVehicleId,
  selectCenteredVehicleId,
  selectFollowedVehicleId,
  selectStatusTextMessages,
  selectAllVehiclesLatLon,
  selectTargetPositions,
  selectGlobalPositionIntData,
  selectGpsTracks,
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

export const makeGetSystemStatusData =
  (vehicleSysId: number) => (state: RootState) =>
    state.vehicles.systemStatusData[vehicleSysId]

export const makeGetGpsRawIntData =
  (vehicleSysId: number) => (state: RootState) =>
    state.vehicles.gpsRawIntData[vehicleSysId]

export const makeGetVibrationData =
  (vehicleSysId: number) => (state: RootState) =>
    state.vehicles.vibrationData[vehicleSysId]

export const makeGetEkfStatusReportData =
  (vehicleSysId: number) => (state: RootState) =>
    state.vehicles.ekfStatusReportData[vehicleSysId]

export default vehiclesSlice
