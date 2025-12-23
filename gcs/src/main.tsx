import "./index.css" // Must be at top

import "@mantine/core/styles.css"
import "@mantine/notifications/styles.css"

import { MantineProvider } from "@mantine/core"
import ReactDOM from "react-dom/client"
import { Provider } from "react-redux"
import App from "./App.tsx"
import { store } from "./redux/store.ts"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <MantineProvider defaultColorScheme="dark">
    <Provider store={store}>
      <App />
    </Provider>
  </MantineProvider>,
)

// Remove Preload scripts loading
postMessage({ payload: "removeLoading" }, "*")

// Use contextBridge
window.ipcRenderer.on("main-process-message", (_event, message) => {
  console.log(message)
})
