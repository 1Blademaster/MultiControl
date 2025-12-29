import { useRef } from "react"
import { MapRef } from "react-map-gl/maplibre"
import ControlBar from "./components/controlBar"
import MapSection from "./components/mapSection"
import Navbar from "./components/navbar"
import StatusTextMessagesContainer from "./components/statusTextMessagesContainer"
import VehicleCardsContainer from "./components/vehicleCardsContainer"

export default function Dashboard() {
  const mapRef = useRef<MapRef | null>(null)
  return (
    <div className="relative flex flex-auto w-full h-full overflow-hidden">
      <div className="w-full">
        <MapSection passedRef={mapRef} />
      </div>

      <Navbar />

      <VehicleCardsContainer />

      <ControlBar />

      <StatusTextMessagesContainer />
    </div>
  )
}
