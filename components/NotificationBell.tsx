"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, X, Check, Trash2, FileText, MessageSquare, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/utils/supabase/client"
import { fetchNotifications, deleteAllNotifications, deleteNotification } from "@/utils/supabase/notifications"
import { format } from "date-fns"
import { Database } from "@/types_db"

type Notification = Database['public']['Tables']['notifications']['Row']

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationCount, setNotificationCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  
  // Memoize the Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()

  useEffect(() => {
    // Only fetch notifications if we have a user
    const checkAuthAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        fetchNotificationsData()
      }
    }
    
    checkAuthAndFetch()
    
    // Poll for new notifications every 2 minutes
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        fetchNotificationsData()
      }
    }, 120000) // 2 minutes
    
    return () => clearInterval(interval)
  }, [supabase])

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

  const handleNotificationClickLocal = async (notification: Notification) => {
    try {
      // Just mark as read and remove - no navigation
      const deleted = await deleteNotification(notification.id)
      
      if (deleted) {
        // Remove notification from local state
        setNotifications(prev => prev.filter(n => n.id !== notification.id))
        setNotificationCount(prev => Math.max(0, prev - 1))
        setOpen(false)
        

      } else {
        toast({
          title: "Error",
          description: "Could not clear the notification.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error handling notification click:', error)
      toast({
        title: "Error",
        description: "Something went wrong while processing the notification.",
        variant: "destructive"
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const deletedCount = await deleteAllNotifications(user.id)

      if (deletedCount > 0) {
        setNotifications([])
        setNotificationCount(0)
        toast({
          title: "Notifications cleared",
          description: `Cleared ${deletedCount} notification${deletedCount > 1 ? 's' : ''}.`
        })
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast({
        title: "Error",
        description: "Failed to clear notifications.",
        variant: "destructive"
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <FileText className="h-4 w-4" />
      case 'message':
        return <MessageSquare className="h-4 w-4" />
      case 'application_status':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'application':
        return 'text-blue-600'
      case 'message':
        return 'text-green-600'
      case 'application_status':
        return 'text-amber-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
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
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>General Notifications</span>
          {notificationCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {notificationCount} new
            </Badge>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <ScrollArea className="h-80 sm:h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading notifications...</p>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No notifications</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="group relative"
                >
                  <DropdownMenuItem
                    className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 cursor-default hover:bg-gray-50 w-full"
                  >
                    <div className={`mt-1 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {notification.created_at ? format(new Date(notification.created_at), 'HH:mm') : '--:--'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </DropdownMenuItem>
                  
                  {/* Clear Button - slides out from right */}
                  <div className="absolute left-full top-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform -translate-y-1/2 translate-x-2 group-hover:translate-x-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNotificationClickLocal(notification)
                      }}
                      className="flex items-center justify-center w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-colors duration-200"
                      title="Clear notification"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="flex flex-col gap-1 p-2">
              <DropdownMenuItem
                className="flex items-center justify-center gap-2 text-sm text-red-600"
                onClick={handleMarkAllAsRead}
              >
                <CheckCircle className="h-4 w-4" />
                Mark all as read
              </DropdownMenuItem>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 