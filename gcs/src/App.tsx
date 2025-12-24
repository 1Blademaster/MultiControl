import { Notifications } from "@mantine/notifications"
import { useEffect } from "react"
import { useDispatch } from "react-redux"

import Dashboard from "./dashboard.js"
import { initSocket } from "./redux/slices/socketSlice.js"

export default function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(initSocket())
  }, [dispatch])

  return (
    <>
      <Notifications limit={5} position="top-right" />
      <Dashboard />
    </>
  )
}
