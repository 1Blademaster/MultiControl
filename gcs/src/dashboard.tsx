import { useRef } from "react"
import { MapRef } from "react-map-gl/maplibre"
import DroneCardsContainer from "./components/droneCardsContainer"
import MapSection from "./components/mapSection"
import Navbar from "./components/navbar"

export default function Dashboard() {
  const mapRef = useRef<MapRef | null>(null)
  return (
    <div className="relative flex flex-auto w-full h-full overflow-hidden">
      <div className="w-full">
        <MapSection passedRef={mapRef} />
      </div>

      <Navbar />

      <DroneCardsContainer />
    </div>
  )
}
