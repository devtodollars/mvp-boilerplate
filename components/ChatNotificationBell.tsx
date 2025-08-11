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
import {
  MessageSquare,
  ExternalLink,
  User,
  Building2
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

interface ChatRoom {
  id: string
  application_id: string
  owner_id: string
  applicant_id: string
  application: {
    id: string
    status: string
    listing: {
      id: string
      title: string
      address: string
      property_name: string
    }
  }
  owner: {
    id: string
    full_name: string
    avatar_url?: string
  }
  applicant: {
    id: string
    full_name: string
    avatar_url?: string
  }
  last_message?: {
    content: string
    created_at: string
  }
}

export default function ChatNotificationBell() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  
  // Memoize the Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const setupSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      fetchChatRooms()
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
      
      // Poll for new chat rooms and unread counts every 2 minutes
      const interval = setInterval(() => {
        fetchChatRooms()
        fetchUnreadCount()
      }, 120000) // 2 minutes
      
      return () => {
        clearInterval(interval)
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

  const fetchChatRooms = async () => {
    try {
      setLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user's active applications and chat rooms
      const [{ data: applicantApps, error: applicantError }, { data: ownedListings, error: listingsError }] = await Promise.all([
        supabase
          .from('applications')
          .select('id,status,user_id,listing_id')
          .in('status', ['pending', 'accepted', 'rejected', 'withdrawn'])
          .eq('user_id', user.id),
        supabase
          .from('listings')
          .select('id, user_id, property_name, address')
          .eq('user_id', user.id)
      ])

      if (applicantError) {
        console.error('Error fetching applications (applicant):', applicantError)
      }
      if (listingsError) {
        console.error('Error fetching owned listings:', listingsError)
      }

      // Get owner-side applications for owned listing ids
      let ownerApps: any[] = []
      const ownedListingIds = (ownedListings || []).map((l: any) => l.id)
      if (ownedListingIds.length > 0) {
        const { data: ownerAppsData, error: ownerError } = await supabase
          .from('applications')
          .select('id,status,user_id,listing_id')
          .in('status', ['pending', 'accepted', 'rejected', 'withdrawn'])
          .in('listing_id', ownedListingIds)

        if (ownerError) {
          console.error('Error fetching applications (owner):', ownerError)
        }
        ownerApps = ownerAppsData || []
      }

      const allApps: any[] = [...(applicantApps || []), ...ownerApps]
      if (allApps.length === 0) {
        setChatRooms([])
        return
      }

      // Fetch chat rooms for all applications
      const chatRoomPromises = allApps.map(async (app) => {
        try {
          const response = await fetch(`/api/chat/rooms/${app.id}`)
          if (response.ok) {
            const { chatRoom } = await response.json()
            return chatRoom
          }
        } catch (error) {
          console.error('Error fetching chat room for application:', app.id, error)
        }
        return null
      })

      const chatRoomsData = (await Promise.all(chatRoomPromises)).filter(Boolean)
      
      // Sort by last message time (most recent first)
      const sortedChatRooms = chatRoomsData.sort((a, b) => {
        const aTime = a.last_message?.created_at || '1970-01-01'
        const bTime = b.last_message?.created_at || '1970-01-01'
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      })

      setChatRooms(sortedChatRooms)

    } catch (error) {
      console.error('Error fetching chat rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChatRoomClick = async (chatRoom: ChatRoom) => {
    try {
      // Open chat panel with this application
      window.dispatchEvent(new CustomEvent('openChat', {
        detail: { 
          showPanel: true,
          applicationId: chatRoom.application_id
        }
      }))
      setOpen(false)
    } catch (error) {
      console.error('Error opening chat room:', error)
      toast({
        title: "Error",
        description: "Could not open the chat room.",
        variant: "destructive"
      })
    }
  }

  const handleViewAllChats = () => {
    // Open chat panel
    window.dispatchEvent(new CustomEvent('openChat', {
      detail: { showPanel: true }
    }))
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
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
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Recent Chats</span>
          {chatRooms.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {chatRooms.length} active
            </Badge>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <ScrollArea className="h-80 sm:h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading chats...</p>
              </div>
            </div>
          ) : chatRooms.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No active chats</p>
            </div>
          ) : (
            <div className="space-y-1">
              {chatRooms.slice(0, 5).map((chatRoom) => {
                const isOwner = chatRoom.owner_id === chatRoom.application?.listing?.id
                const otherPartyName = isOwner
                  ? (chatRoom.applicant?.full_name || 'Applicant')
                  : (chatRoom.owner?.full_name || 'Property Owner')
                const propertyName = chatRoom.application?.listing?.property_name || 'Property'
                const role = isOwner ? 'applicant' : 'owner'

                return (
                  <DropdownMenuItem
                    key={chatRoom.id}
                    className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleChatRoomClick(chatRoom)}
                  >
                    <div className="mt-1 text-blue-600">
                      {role === 'owner' ? (
                        <Building2 className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {otherPartyName}
                        </p>
                        <Badge 
                          variant={chatRoom.application?.status === 'accepted' ? 'default' : 
                                 chatRoom.application?.status === 'pending' ? 'secondary' : 
                                 chatRoom.application?.status === 'rejected' ? 'destructive' : 'outline'}
                          className="text-xs h-4 px-2 flex-shrink-0"
                        >
                          {chatRoom.application?.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {propertyName}
                      </p>
                      {chatRoom.last_message && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {chatRoom.last_message.content}
                        </p>
                      )}
                      {chatRoom.last_message && (
                        <span className="text-xs text-gray-400 mt-1">
                          {format(new Date(chatRoom.last_message.created_at), 'HH:mm')}
                        </span>
                      )}
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {chatRooms.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="flex flex-col gap-1 p-2">
              <DropdownMenuItem
                className="flex items-center justify-center gap-2 text-sm text-gray-600"
                onClick={handleViewAllChats}
              >
                <ExternalLink className="h-4 w-4" />
                View all chats
              </DropdownMenuItem>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 