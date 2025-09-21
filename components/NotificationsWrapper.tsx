"use client"

import { useState, useEffect } from "react"
import NotificationsPanel from "./NotificationsPanel"

export default function NotificationsWrapper() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  useEffect(() => {
    const handleOpenNotifications = (event: CustomEvent) => {
      setIsNotificationsOpen(true)
    }

    // Listen for the custom event to open notifications
    window.addEventListener('openNotifications', handleOpenNotifications as EventListener)

    return () => {
      window.removeEventListener('openNotifications', handleOpenNotifications as EventListener)
    }
  }, [])

  return (
    <NotificationsPanel
      isOpen={isNotificationsOpen}
      onClose={() => setIsNotificationsOpen(false)}
    />
  )
}
