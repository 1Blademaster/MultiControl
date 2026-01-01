import { ScrollArea, Text } from "@mantine/core"
import { MavSeverity } from "mavlink-mappings/dist/lib/common"
import { useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import {
  selectStatusTextMessages,
  selectVehicleColors,
  StatusTextMessageRecord,
} from "../redux/slices/vehiclesSlice"

function calculateStatusTextMessageProps(msg: StatusTextMessageRecord): {
  c?: string
  fw?: number
} {
  switch (msg.severity) {
    case MavSeverity.EMERGENCY:
      return { c: "red.8", fw: 700 }
    case MavSeverity.ALERT:
      return { c: "red.7", fw: 600 }
    case MavSeverity.CRITICAL:
      return { c: "red.6" }
    case MavSeverity.ERROR:
      return { c: "red.5" }
    case MavSeverity.WARNING:
      return { c: "orange" }
    case MavSeverity.NOTICE:
      return {}
    case MavSeverity.INFO:
      return { c: "gray.3" }
    case MavSeverity.DEBUG:
      return { c: "gray.5" }
    default:
      return {}
  }
}

export default function StatusTextMessagesContainer() {
  const statusTextMessages = useSelector(selectStatusTextMessages)
  const vehicleColors = useSelector(selectVehicleColors)

  const scrollAreaRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollAreaRef.current!.scrollTo({ top: 0, behavior: "smooth" })
  }, [statusTextMessages])

  return (
    <div className="absolute bottom-0 right-0 w-120 h-120 bg-zinc-800/80 flex flex-col gap-2 p-2">
      <ScrollArea ref={scrollAreaRef}>
        {statusTextMessages.length === 0 && (
          <Text ta="center" size="lg">
            No messages
          </Text>
        )}
        {statusTextMessages.map((msg, idx) => (
          <div key={idx} className={`status-message ${msg.severity}`}>
            <Text size="lg" {...calculateStatusTextMessageProps(msg)}>
              <Text component="span" c="gray.5">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </Text>{" "}
              <Text component="span" c={vehicleColors[msg.system_id]}>
                [{msg.system_id}]
              </Text>{" "}
              {msg.text}
            </Text>
          </div>
        ))}
      </ScrollArea>
    </div>
  )
}
