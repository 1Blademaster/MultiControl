import { useLocalStorage } from "@mantine/hooks"
import { center, distance, points } from "@turf/turf"
import "maplibre-gl/dist/maplibre-gl.css"
import React, { useEffect, useMemo, useState } from "react"
import Map, {
  Layer,
  MapLayerMouseEvent,
  MapRef,
  Source,
} from "react-map-gl/maplibre"
import { useDispatch, useSelector } from "react-redux"
import {
  clearTargetPosition,
  makeGetGlobalPositionIntData,
  selectAllVehiclesLatLon,
  selectCenteredVehicleId,
  selectFollowedVehicleId,
  selectGlobalPositionIntData,
  selectGpsTracks,
  selectTargetPositions,
  selectVehicleColors,
  selectVehicleSysIds,
  setCenteredVehicle,
  setFollowedVehicle,
} from "../redux/slices/vehiclesSlice"
import { intToCoord } from "../utils/dataFormatters"
import MapContextMenu from "./mapContextMenu"
import TargetPositionMarker from "./targetPositionMarker"
import VehicleMarker from "./vehicleMarker"

interface MapSectionProps {
  passedRef: React.Ref<MapRef>
}

function MapSectionNonMemo({ passedRef }: MapSectionProps) {
  const dispatch = useDispatch()
  const vehicleSysIds = useSelector(selectVehicleSysIds)
  const vehicleColors = useSelector(selectVehicleColors)
  const targetPositions = useSelector(selectTargetPositions)
  const centeredVehicleId = useSelector(selectCenteredVehicleId)
  const followedVehicleId = useSelector(selectFollowedVehicleId)
  const allVehiclesLatLon = useSelector(selectAllVehiclesLatLon)
  const globalPositionIntData = useSelector(selectGlobalPositionIntData)
  const gpsTracks = useSelector(selectGpsTracks)

  const [contextMenuOpened, setContextMenuOpened] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [contextMenuCoordinates, setContextMenuCoordinates] = useState<{
    lat: number
    lng: number
  } | null>(null)

  const selectFollowedVehiclePosition = useMemo(
    () =>
      followedVehicleId
        ? makeGetGlobalPositionIntData(followedVehicleId)
        : null,
    [followedVehicleId],
  )
  const followedVehiclePosition = useSelector(
    selectFollowedVehiclePosition ?? (() => null),
  )

  const selectCenteredVehiclePosition = useMemo(
    () =>
      centeredVehicleId
        ? makeGetGlobalPositionIntData(centeredVehicleId)
        : null,
    [centeredVehicleId],
  )
  const centeredVehiclePosition = useSelector(
    selectCenteredVehiclePosition ?? (() => null),
  )

  const [initialViewState, setInitialViewState] = useLocalStorage({
    key: "initialViewState",
    defaultValue: { latitude: 53.381655, longitude: -1.481434, zoom: 4 },
    getInitialValueInEffect: false,
  })

  // Check if vehicles have reached their target positions and clear markers
  useEffect(() => {
    Object.values(targetPositions).forEach((target) => {
      const vehiclePosition = globalPositionIntData[target.system_id]
      if (vehiclePosition) {
        const distance_m = distance(
          [intToCoord(vehiclePosition.lon), intToCoord(vehiclePosition.lat)],
          [target.lon, target.lat],
          { units: "meters" },
        )
        // If within 1 meter, clear the target position
        if (distance_m <= 1) {
          dispatch(clearTargetPosition(target.system_id))
        }
      }
    })
  }, [globalPositionIntData, targetPositions, dispatch])

  // Handle centering on a vehicle (one-time)
  useEffect(() => {
    if (centeredVehicleId && centeredVehiclePosition && passedRef) {
      const mapRef = passedRef as React.MutableRefObject<MapRef | null>
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [
            intToCoord(centeredVehiclePosition.lon),
            intToCoord(centeredVehiclePosition.lat),
          ],
          duration: 250,
        })
      }
      // Clear the centered vehicle after centering
      dispatch(setCenteredVehicle(null))
    }
  }, [centeredVehicleId, centeredVehiclePosition, passedRef, dispatch])

  // Handle following a vehicle (continuous)
  useEffect(() => {
    if (followedVehicleId && followedVehiclePosition && passedRef) {
      const mapRef = passedRef as React.MutableRefObject<MapRef | null>
      if (mapRef.current) {
        mapRef.current.easeTo({
          center: [
            intToCoord(followedVehiclePosition.lon),
            intToCoord(followedVehiclePosition.lat),
          ],
          duration: 250,
        })
      }
    }
  }, [followedVehicleId, followedVehiclePosition, passedRef])

  function handleCenterAllVehicles() {
    if (!allVehiclesLatLon.length) return

    const centerCoords = center(
      points(allVehiclesLatLon.map((coord) => [coord.lng, coord.lat])),
    ).geometry.coordinates
    if (passedRef) {
      const mapRef = passedRef as React.MutableRefObject<MapRef | null>
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [centerCoords[0], centerCoords[1]],
          duration: 250,
        })
      }
    }
  }

  function handleMapContextMenu(e: MapLayerMouseEvent) {
    e.preventDefault()
    setContextMenuPosition({ x: e.point.x, y: e.point.y })
    setContextMenuCoordinates({ lat: e.lngLat.lat, lng: e.lngLat.lng })
    setContextMenuOpened(true)
  }

  return (
    <MapContextMenu
      onCenterAllVehicles={handleCenterAllVehicles}
      opened={contextMenuOpened}
      onClose={() => setContextMenuOpened(false)}
      position={contextMenuPosition}
      coordinates={contextMenuCoordinates}
    >
      <Map
        initialViewState={initialViewState}
        mapStyle={`https://api.maptiler.com/maps/hybrid/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`}
        ref={passedRef}
        attributionControl={false}
        dragRotate={false}
        onContextMenu={handleMapContextMenu}
        onDragStart={() => {
          dispatch(setFollowedVehicle(null))
        }}
        onMoveEnd={(newViewState) =>
          setInitialViewState({
            latitude: newViewState.viewState.latitude,
            longitude: newViewState.viewState.longitude,
            zoom: newViewState.viewState.zoom,
          })
        }
        cursor="default"
        style={{ outline: "none" }}
      >
        {/* Draw GPS tracks */}
        {vehicleSysIds.map((sysId) => {
          const track = gpsTracks[sysId]

          if (!track || track.length < 2) return null

          const trackGeoJSON = {
            type: "Feature" as const,
            properties: {},
            geometry: {
              type: "LineString" as const,
              coordinates: track.map((point) => [point.lon, point.lat]),
            },
          }

          return (
            <Source key={`track-${sysId}`} type="geojson" data={trackGeoJSON}>
              <Layer
                id={`track-layer-${sysId}`}
                type="line"
                paint={{
                  "line-color": vehicleColors[sysId],
                  "line-width": 2,
                }}
              />
            </Source>
          )
        })}

        {/* Draw dashed lines from vehicles to their target positions */}
        {Object.values(targetPositions).map((target) => {
          const vehiclePosition = globalPositionIntData[target.system_id]

          if (!vehiclePosition) return null

          const lineGeoJSON = {
            type: "Feature" as const,
            properties: {},
            geometry: {
              type: "LineString" as const,
              coordinates: [
                [
                  intToCoord(vehiclePosition.lon),
                  intToCoord(vehiclePosition.lat),
                ],
                [target.lon, target.lat],
              ],
            },
          }

          return (
            <Source
              key={`line-${target.system_id}`}
              type="geojson"
              data={lineGeoJSON}
            >
              <Layer
                id={`line-layer-${target.system_id}`}
                type="line"
                paint={{
                  "line-color": vehicleColors[target.system_id],
                  "line-width": 2,
                  "line-dasharray": [2, 2],
                }}
              />
            </Source>
          )
        })}

        {Object.values(targetPositions).map((target) => (
          <TargetPositionMarker
            key={target.system_id}
            lat={target.lat}
            lon={target.lon}
            color={vehicleColors[target.system_id]}
            altitude={target.altitude}
          />
        ))}

        {vehicleSysIds.map((sysId) => (
          <VehicleMarker
            key={sysId}
            sysId={sysId}
            color={vehicleColors[sysId]}
          />
        ))}
      </Map>
    </MapContextMenu>
  )
}

function propsAreEqual(prevProps: MapSectionProps, nextProps: MapSectionProps) {
  return JSON.stringify(prevProps) === JSON.stringify(nextProps)
}

const MapSection = React.memo(MapSectionNonMemo, propsAreEqual)

export default MapSection
