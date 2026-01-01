import { useLocalStorage } from "@mantine/hooks"
import "maplibre-gl/dist/maplibre-gl.css"
import React, { useEffect, useMemo } from "react"
import Map, { MapRef } from "react-map-gl/maplibre"
import { useDispatch, useSelector } from "react-redux"
import {
  makeGetGlobalPositionIntData,
  selectCenteredVehicleId,
  selectFollowedVehicleId,
  selectVehicleColors,
  selectVehicleSysIds,
  setCenteredVehicle,
  setFollowedVehicle,
} from "../redux/slices/vehiclesSlice"
import { intToCoord } from "../utils/dataFormatters"
import VehicleMarker from "./vehicleMarker"

interface MapSectionProps {
  passedRef: React.Ref<MapRef>
}

function MapSectionNonMemo({ passedRef }: MapSectionProps) {
  const dispatch = useDispatch()
  const vehicleSysIds = useSelector(selectVehicleSysIds)
  const vehicleColors = useSelector(selectVehicleColors)
  const centeredVehicleId = useSelector(selectCenteredVehicleId)
  const followedVehicleId = useSelector(selectFollowedVehicleId)

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

  return (
    <div className="w-initial h-full focus-visible:outline-none" id="map">
      <Map
        initialViewState={initialViewState}
        mapStyle={`https://api.maptiler.com/maps/hybrid/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`}
        ref={passedRef}
        attributionControl={false}
        dragRotate={false}
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
        {vehicleSysIds.map((sysId) => (
          <VehicleMarker
            key={sysId}
            sysId={sysId}
            color={vehicleColors[sysId]}
          />
        ))}
      </Map>
    </div>
  )
}

function propsAreEqual(prevProps: MapSectionProps, nextProps: MapSectionProps) {
  return JSON.stringify(prevProps) === JSON.stringify(nextProps)
}

const MapSection = React.memo(MapSectionNonMemo, propsAreEqual)

export default MapSection
