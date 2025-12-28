import { useLocalStorage } from "@mantine/hooks"
import "maplibre-gl/dist/maplibre-gl.css"
import React from "react"
import Map, { MapRef } from "react-map-gl/maplibre"
import { useSelector } from "react-redux"
import {
  selectVehicleColors,
  selectVehicleSysIds,
} from "../redux/slices/vehiclesSlice"
import VehicleMarker from "./vehicleMarker"

interface MapSectionProps {
  passedRef: React.Ref<MapRef>
}

function MapSectionNonMemo({ passedRef }: MapSectionProps) {
  const vehicleSysIds = useSelector(selectVehicleSysIds)
  const vehicleColors = useSelector(selectVehicleColors)

  const [initialViewState, setInitialViewState] = useLocalStorage({
    key: "initialViewState",
    defaultValue: { latitude: 53.381655, longitude: -1.481434, zoom: 4 },
    getInitialValueInEffect: false,
  })

  return (
    <div className="w-initial h-full focus-visible:outline-none" id="map">
      <Map
        initialViewState={initialViewState}
        mapStyle={`https://api.maptiler.com/maps/hybrid/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`}
        ref={passedRef}
        attributionControl={false}
        dragRotate={false}
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
