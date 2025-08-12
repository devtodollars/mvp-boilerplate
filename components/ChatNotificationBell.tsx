"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function ChatNotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)

  // Memoize the Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const setupSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      fetchUnreadCount()

      // Set up real-time subscription for notifications
      const channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            // Refresh unread count when notifications change
            fetchUnreadCount()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    // Only set up subscriptions if we have a user
    const checkAuthAndSetup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setupSubscriptions()
      }
    }

    checkAuthAndSetup()
  }, [supabase])

  const fetchUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Count unread message notifications
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'message')

      if (error) {
        console.error('Error counting unread notifications:', error)
        return
      }

      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  // Handle message icon click - open chat directly
  const handleMessageClick = () => {
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
      onClick={handleMessageClick}
    >
      <MessageSquare className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  )
} 