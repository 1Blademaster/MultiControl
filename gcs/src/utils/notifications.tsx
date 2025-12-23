import { notifications } from "@mantine/notifications"

const notificationTheme = {
  radius: "md",
}

export function showErrorNotification(message: string) {
  notifications.show({
    title: "Error",
    message: message,
    color: "red",
    ...notificationTheme,
  })
}

export function showSuccessNotification(message: string) {
  notifications.show({
    title: "Success",
    message: message,
    color: "green",
    ...notificationTheme,
  })
}

export function showWarningNotification(message: string) {
  notifications.show({
    title: "Warning",
    message: message,
    color: "yellow",
    ...notificationTheme,
  })
}

export function showInfoNotification(message: string) {
  notifications.show({
    title: "Info",
    message: message,
    color: "blue",
    ...notificationTheme,
  })
}
