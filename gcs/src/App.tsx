import { Notifications } from "@mantine/notifications"
import { useEffect } from "react"
import { useDispatch } from "react-redux"

import Navbar from "./components/navbar.js"
import Dashboard from "./dashboard.js"
import { initSocket } from "./redux/slices/socketSlice.js"

export default function App() {
  const dispatch = useDispatch()

  // const connectedToDrone = useSelector(selectConnectedToDrone)

  // Setup sockets for redux
  useEffect(() => {
    dispatch(initSocket())
  }, [dispatch])

  return (
    <>
      <Notifications limit={5} position="top-right" />
      <Navbar className="no-drag" />
      <Dashboard />
    </>
  )
}
