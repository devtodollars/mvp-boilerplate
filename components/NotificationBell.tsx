"use client"

import { useState, useEffect } from "react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bell,
  MessageSquare,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  fetchNotifications,
  getNotificationCount,
  deleteAllNotifications,
  handleNotificationClick
} from "@/utils/supabase/notifications"
import { Database } from "@/types_db"

type Notification = Database['public']['Tables']['notifications']['Row']

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationCount, setNotificationCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchNotificationsData()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotificationsData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotificationsData = async () => {
    try {
      setLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch notifications from the database
      const notificationsData = await fetchNotifications(user.id, 20)
      const countData = await getNotificationCount(user.id)

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
      // Handle navigation and deletion
      const success = await handleNotificationClick(notification, router)
      
      if (success) {
        // Remove notification from local state
        setNotifications(prev => prev.filter(n => n.id !== notification.id))
        setNotificationCount(prev => Math.max(0, prev - 1))
        setOpen(false)
      } else {
        // Show error toast if navigation failed
        toast({
          title: "Navigation failed",
          description: "Could not navigate to the notification content.",
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

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notificationCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {notificationCount} new
            </Badge>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <ScrollArea className="h-80">
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
                <DropdownMenuItem
                  key={notification.id}
                  className="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleNotificationClickLocal(notification)}
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
                        {format(new Date(notification.created_at), 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="flex flex-col gap-1 p-2">
              <DropdownMenuItem
                className="flex items-center justify-center gap-2 text-sm text-gray-600"
                onClick={() => {
                  router.push('/notifications')
                  setOpen(false)
                }}
              >
                <ExternalLink className="h-4 w-4" />
                View all notifications
              </DropdownMenuItem>
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