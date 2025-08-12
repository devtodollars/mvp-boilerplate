"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/utils/supabase/client"
import { fetchNotifications, deleteAllNotifications, deleteNotification } from "@/utils/supabase/notifications"
import { Database } from "@/types_db"

type Notification = Database['public']['Tables']['notifications']['Row']

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationCount, setNotificationCount] = useState(0)
  const [loading, setLoading] = useState(false)
  
  // Memoize the Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  
  // Keep track of the realtime subscription channel (same pattern as ChatTabs)
  const notificationChannelRef = useRef<any>(null)

  useEffect(() => {
    // Only fetch notifications if we have a user
    const checkAuthAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        fetchNotificationsData()
        setupNotificationSubscription(user.id)
      }
    }
    
    checkAuthAndFetch()
    
    // Cleanup function (same pattern as ChatTabs)
    return () => {
      if (notificationChannelRef.current) {
        try { supabase.removeChannel(notificationChannelRef.current) } catch { }
        notificationChannelRef.current = {}
      }
    }
  }, [supabase])

  // Setup realtime subscription for notifications (same pattern as ChatTabs)
  const setupNotificationSubscription = (userId: string) => {
    // Remove existing subscription if any
    if (notificationChannelRef.current) {
      try { supabase.removeChannel(notificationChannelRef.current) } catch { }
    }

    // Set up real-time subscription for notifications (same structure as ChatTabs)
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New notification received:', payload)
          
          // New notification received - append immediately for instant UI update (same as ChatTabs)
          const newNotification = payload.new as Notification
          
          // Only add if it's not a message notification (since those are handled by ChatTabs)
          if (newNotification.type !== 'message') {
            setNotifications(prev => {
              const existing = prev || []
              if (existing.some(n => n.id === newNotification.id)) return prev
              return [newNotification, ...existing]
            })
            
            setNotificationCount(prev => prev + 1)
            
            // Show toast for new notification
            toast({
              title: newNotification.title,
              description: newNotification.message,
              duration: 5000
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Notification deleted:', payload)
          
          // Notification was deleted - remove from state (same pattern as ChatTabs)
          const deletedNotificationId = payload.old.id
          setNotifications(prev => prev.filter(n => n.id !== deletedNotificationId))
          setNotificationCount(prev => Math.max(0, prev - 1))
        }
      )
      .subscribe()

    notificationChannelRef.current = channel
  }

  const fetchNotificationsData = async () => {
    try {
      setLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch notifications from the database (excluding chat notifications)
      const allNotifications = await fetchNotifications(user.id, 50)
      const notificationsData = allNotifications.filter(n => n.type !== 'message')
      const countData = notificationsData.length

      setNotifications(notificationsData)
      setNotificationCount(countData)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle bell click - open chat directly
  const handleBellClick = () => {
    // Dispatch custom event to open chat (same pattern used elsewhere in the app)
    const openChatEvent = new CustomEvent('openChat', {
      detail: { showPanel: true }
    })
    window.dispatchEvent(openChatEvent)
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="relative"
      onClick={handleBellClick}
    >
      <Bell className="h-5 w-5" />
      {notificationCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {notificationCount > 9 ? '9+' : notificationCount}
        </Badge>
      )}
    </Button>
  )
} 