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

interface Notification {
  id: string
  type: 'application' | 'message' | 'application_status'
  title: string
  message: string
  read: boolean
  created_at: string
  data?: {
    application_id?: string
    listing_id?: string
    listing_name?: string
    sender_name?: string
    status?: string
  }
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch applications for notifications
      const { data: applications } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          listing:listings(property_name, user_id),
          user:users(full_name, first_name, last_name)
        `)
        .or(`user_id.eq.${user.id},listing.user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch recent messages for notifications
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender:users(full_name, first_name, last_name),
          chat_room:chat_rooms(
            application:applications(id, listing:listings(property_name))
          )
        `)
        .neq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      // Transform data into notifications
      const appNotifications: Notification[] = (applications || []).map(app => ({
        id: `app_${app.id}`,
        type: 'application' as const,
        title: app.listing.user_id === user.id 
          ? `New application for ${app.listing.property_name}`
          : `Application ${app.status} for ${app.listing.property_name}`,
        message: app.listing.user_id === user.id
          ? `${app.user.full_name || `${app.user.first_name} ${app.user.last_name}`.trim()} applied to your property`
          : `Your application was ${app.status}`,
        read: false,
        created_at: app.created_at,
        data: {
          application_id: app.id,
          listing_id: app.listing.id,
          listing_name: app.listing.property_name,
          status: app.status
        }
      }))

      const messageNotifications: Notification[] = (messages || []).map(msg => ({
        id: `msg_${msg.id}`,
        type: 'message' as const,
        title: `New message from ${msg.sender.full_name || `${msg.sender.first_name} ${msg.sender.last_name}`.trim()}`,
        message: msg.content.length > 50 ? `${msg.content.substring(0, 50)}...` : msg.content,
        read: false,
        created_at: msg.created_at,
        data: {
          application_id: msg.chat_room.application.id,
          listing_name: msg.chat_room.application.listing.property_name,
          sender_name: msg.sender.full_name || `${msg.sender.first_name} ${msg.sender.last_name}`.trim()
        }
      }))

      const allNotifications = [...appNotifications, ...messageNotifications]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20)

      setNotifications(allNotifications)
      setUnreadCount(allNotifications.filter(n => !n.read).length)

    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id)

    if (notification.type === 'application') {
      if (notification.data?.application_id) {
        router.push(`/applications/${notification.data.application_id}`)
      }
    } else if (notification.type === 'message') {
      if (notification.data?.application_id) {
        // Open chat tab instead of navigating to separate page
        window.dispatchEvent(new CustomEvent('openChat', {
          detail: { applicationId: notification.data.application_id }
        }))
      }
    }

    setOpen(false)
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
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
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
                  className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
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
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 