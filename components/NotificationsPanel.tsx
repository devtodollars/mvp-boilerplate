"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  MessageSquare,
  Calendar,
  User,
  Home,
  Trash2,
  Loader2
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/components/providers/AuthProvider"
import { useToast } from "@/components/ui/use-toast"
import { Database } from "@/types_db"

type Notification = Database['public']['Tables']['notifications']['Row']

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null)
  
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const { user } = useAuth()
  
  const notificationChannelRef = useRef<any>(null)

  useEffect(() => {
    if (user && isOpen) {
      fetchNotifications()
      setupNotificationSubscription(user.id)
    }
    
    return () => {
      if (notificationChannelRef.current) {
        try { 
          supabase.removeChannel(notificationChannelRef.current);
        } catch (error) {
          console.warn('Failed to remove notification channel:', error);
        }
        notificationChannelRef.current = null;
      }
    }
  }, [user, isOpen, supabase])

  const setupNotificationSubscription = (userId: string) => {
    if (notificationChannelRef.current) {
      supabase.removeChannel(notificationChannelRef.current)
    }

    const channel = supabase
      .channel(`notifications-panel-${userId}`)
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
          const newNotification = payload.new as Notification
          // Only add non-message notifications to match NotificationBell
          if (newNotification.type !== 'message') {
            setNotifications(prev => [newNotification, ...prev])
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
          const deletedNotificationId = payload.old.id
          setNotifications(prev => prev.filter(n => n.id !== deletedNotificationId))
        }
      )
      .subscribe()

    notificationChannelRef.current = channel
  }

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .neq('type', 'message') // Exclude message notifications to match NotificationBell
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching notifications:', error)
        toast({
          title: 'Error',
          description: 'Failed to load notifications',
          variant: 'destructive',
        })
        return
      }

      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      setMarkingAsRead(notificationId)
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        toast({
          title: 'Error',
          description: 'Failed to mark notification as read',
          variant: 'destructive',
        })
        return
      }

      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      // Dispatch event to update notification bell count
      console.log('NotificationsPanel: Dispatching notificationDeleted event for', notificationId)
      const notificationDeletedEvent = new CustomEvent('notificationDeleted', {
        detail: { notificationId }
      })
      window.dispatchEvent(notificationDeletedEvent)
      
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      })
    } finally {
      setMarkingAsRead(null)
    }
  }

  const markAllAsRead = async () => {
    try {
      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        toast({
          title: 'Error',
          description: 'Failed to mark all notifications as read',
          variant: 'destructive',
        })
        return
      }

      setNotifications([])
      
      // Dispatch event to update notification bell count
      console.log('NotificationsPanel: Dispatching allNotificationsDeleted event')
      const allNotificationsDeletedEvent = new CustomEvent('allNotificationsDeleted')
      window.dispatchEvent(allNotificationsDeletedEvent)
      
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      })
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-600" />
      case 'application':
        return <User className="h-4 w-4 text-green-600" />
      case 'listing':
        return <Home className="h-4 w-4 text-purple-600" />
      case 'payment':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default:
        return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const formatNotificationTime = (createdAt: string) => {
    const now = new Date()
    const notificationTime = new Date(createdAt)
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center sm:justify-end p-2 sm:p-4">
      <Card className="w-full max-w-md max-h-[90vh] sm:max-h-[80vh] flex flex-col mx-2 sm:mx-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 sm:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <Bell className="h-5 w-5 flex-shrink-0" />
            <CardTitle className="text-base sm:text-lg truncate">Notifications</CardTitle>
            {notifications.length > 0 && (
              <Badge variant="secondary" className="flex-shrink-0">{notifications.length}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={loading}
                className="hidden sm:inline-flex text-xs"
              >
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[50vh] sm:h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-sm text-gray-500">
                  You're all caught up! New notifications will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-3 sm:p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 break-words">
                              {notification.title}
                            </p>
                            {notification.message && (
                              <p className="text-sm text-gray-600 mt-1 break-words">
                                {notification.message}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {formatNotificationTime(notification.created_at)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            disabled={markingAsRead === notification.id}
                            className="flex-shrink-0 p-2"
                          >
                            {markingAsRead === notification.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
        
        {/* Mobile Mark All Read Button */}
        {notifications.length > 0 && (
          <div className="sm:hidden border-t border-gray-200 p-3">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={loading}
              className="w-full"
            >
              Mark all as read
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
