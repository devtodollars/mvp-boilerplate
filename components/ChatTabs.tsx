'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  X, 
  Minimize2, 
  Maximize2,
  Send
} from 'lucide-react'

interface ChatTab {
  id: string
  applicationId: string
  title: string
  isOpen: boolean
  isMinimized: boolean
  unreadCount: number
  otherPartyName: string
  propertyName: string
}

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  sender?: {
    id: string
    full_name?: string
    avatar_url?: string | null
  }
}

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
}

export default function ChatTabs() {
  const [chatTabs, setChatTabs] = useState<ChatTab[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [newMessages, setNewMessages] = useState<Record<string, string>>({})
  const [chatRooms, setChatRooms] = useState<Record<string, ChatRoom>>({})
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const supabase = createClient()
  // Keep realtime channels per chat_room_id
  const roomChannelsRef = useRef<Record<string, any>>({})
  // Keep bottom sentinels per chat_room_id for autoscroll
  const messageEndRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Get current user
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user?.id || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Fetch user's active applications
  const fetchActiveApplications = useCallback(async () => {
    if (!currentUser) return

    try {
      // Get user's applications and applications for listings they own
      const { data: applications, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          user_id,
          listing:listings(
            id,
            property_name,
            address,
            user_id
          ),
          user:users(full_name)
        `)
        .eq('status', 'accepted')
        .or(`user_id.eq.${currentUser},listing.user_id.eq.${currentUser}`)

      if (error) {
        console.error('Error fetching applications:', error)
        return
      }

      if (!applications || applications.length === 0) {
        return
      }

      // Create tabs for each application
      const newTabs: ChatTab[] = applications.map(app => {
        const isOwner = app.listing?.user_id === currentUser
        const otherPartyName = isOwner 
          ? (app.user?.full_name || 'Applicant')
          : (app.listing?.user_id ? 'Property Owner' : 'Owner')
        const propertyName = app.listing?.property_name || 'Property'

        return {
          id: `tab-${app.id}`,
          applicationId: app.id,
          title: `${otherPartyName} - ${propertyName}`,
          isOpen: false,
          isMinimized: false,
          unreadCount: 0,
          otherPartyName,
          propertyName
        }
      })

      setChatTabs(prev => {
        // Merge with existing tabs, preserving state
        const existingTabs = new Map(prev.map(tab => [tab.id, tab]))
        const newTabsMap = new Map(newTabs.map(tab => [tab.id, tab]))
        
        // Merge existing state with new data
        const mergedTabs = newTabs.map(tab => ({
          ...tab,
          ...existingTabs.get(tab.id)
        }))

        return mergedTabs
      })
    } catch (error) {
      console.error('Error in fetchActiveApplications:', error)
    }
  }, [currentUser, supabase])

  // Fetch applications when user changes
  useEffect(() => {
    if (currentUser) {
      fetchActiveApplications()
    } else {
      setChatTabs([])
    }
  }, [currentUser, fetchActiveApplications])

  // Load messages for a chat room
  const loadMessages = useCallback(async (chatRoomId: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${chatRoomId}`)
      const data = await response.json()

      if (data.error) {
        console.error('Error loading messages:', data.error)
        return
      }

      setMessages(prev => ({
        ...prev,
        [chatRoomId]: data.messages || []
      }))
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [])

  // Get or create chat room
  const getChatRoom = useCallback(async (applicationId: string): Promise<{ id: string, chatRoom: ChatRoom } | null> => {
    try {
      const response = await fetch(`/api/chat/rooms/${applicationId}`)
      const data = await response.json()

      if (data.error) {
        console.error('Error getting chat room:', data.error)
        return null
      }

      const chatRoom = data.chatRoom
      setChatRooms(prev => ({
        ...prev,
        [applicationId]: chatRoom
      }))

      return { id: chatRoom.id, chatRoom }
    } catch (error) {
      console.error('Error getting chat room:', error)
      return null
    }
  }, [])

  // Open chat tab
  const openChat = useCallback(async (applicationId: string) => {
    console.log('Opening chat for application:', applicationId)
    
    if (!currentUser) {
      console.log('Current user not loaded yet, waiting...')
      return
    }
    
    // First, get or create the chat room to ensure we have the data
    const result = await getChatRoom(applicationId)
    if (!result) {
      console.error('Failed to get chat room for application:', applicationId)
      return
    }

    const { id: chatRoomId, chatRoom } = result
    console.log('Chat room data:', chatRoom)

    // Determine the other party's name
    const isOwner = chatRoom.owner_id === currentUser
    const otherPartyName = isOwner 
      ? (chatRoom.applicant?.full_name || 'Applicant')
      : (chatRoom.owner?.full_name || 'Property Owner')
    const propertyName = chatRoom.application?.listing?.property_name || 'Property'

    console.log('Chat title will be:', `${otherPartyName} - ${propertyName}`)

    setChatTabs(prev => {
      const existingTab = prev.find(tab => tab.applicationId === applicationId)
      
      if (existingTab) {
        // Update existing tab with proper title and open it
        return prev.map(tab => 
          tab.applicationId === applicationId 
            ? { 
                ...tab, 
                isOpen: true, 
                isMinimized: false,
                title: `${otherPartyName} - ${propertyName}`,
                otherPartyName,
                propertyName
              }
            : tab
        )
      } else {
        // Create new tab
        const newTab: ChatTab = {
          id: `tab-${applicationId}`,
          applicationId,
          title: `${otherPartyName} - ${propertyName}`,
          isOpen: true,
          isMinimized: false,
          unreadCount: 0,
          otherPartyName,
          propertyName
        }
        return [...prev, newTab]
      }
    })

    // Load messages
    await loadMessages(chatRoomId)

    // Subscribe to realtime for this room
    subscribeToRoom(chatRoomId)
  }, [getChatRoom, currentUser, loadMessages])

  // Listen for open chat events
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent) => {
      const { applicationId } = event.detail
      console.log('Received openChat event for application:', applicationId)
      
      // If user isn't loaded yet, retry after a short delay
      if (!currentUser) {
        console.log('User not loaded, retrying in 1 second...')
        setTimeout(() => {
          if (currentUser) {
            openChat(applicationId)
          } else {
            console.error('User still not loaded after retry')
          }
        }, 1000)
        return
      }
      
      openChat(applicationId)
    }

    window.addEventListener('openChat' as any, handleOpenChat)
    return () => window.removeEventListener('openChat' as any, handleOpenChat)
  }, [currentUser, openChat])

  // Send message
  const sendMessage = useCallback(async (applicationId: string) => {
    const messageContent = newMessages[applicationId]?.trim()
    if (!messageContent) return

    const chatRoom = chatRooms[applicationId]
    if (!chatRoom) return

    try {
      const response = await fetch(`/api/chat/messages/${chatRoom.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent })
      })

      const data = await response.json()

      if (data.error) {
        console.error('Error sending message:', data.error)
        return
      }

      // Add message to local state
      setMessages(prev => ({
        ...prev,
        [chatRoom.id]: [...(prev[chatRoom.id] || []), data.message]
      }))

      // Clear input
      setNewMessages(prev => ({
        ...prev,
        [applicationId]: ''
      }))
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }, [newMessages, chatRooms])

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent, applicationId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(applicationId)
    }
  }, [sendMessage])

  // Toggle minimize - FIXED: Now properly toggles between minimized and open states
  const toggleMinimize = useCallback((tabId: string) => {
    console.log('Toggling minimize for tab:', tabId)
    setChatTabs(prev => {
      const updatedTabs = prev.map(tab => {
        if (tab.id === tabId) {
          const newMinimized = !tab.isMinimized
          const newOpen = tab.isMinimized // When we toggle minimize, isOpen becomes the OLD minimized state
          console.log(`Tab ${tabId}: isMinimized ${tab.isMinimized} -> ${newMinimized}, isOpen ${tab.isOpen} -> ${newOpen}`)
          return { 
            ...tab, 
            isMinimized: newMinimized, 
            isOpen: newOpen
          }
        }
        return tab
      })
      return updatedTabs
    })
  }, [])

  // Close chat
  const closeChat = useCallback((tabId: string) => {
    // Unsubscribe if we know the room
    setChatTabs(prev => prev.filter(tab => tab.id !== tabId))
    // Try to find applicationId for this tab and unsubscribe its room channel
    const tab = chatTabs.find(t => t.id === tabId)
    if (tab) {
      const chatRoom = chatRooms[tab.applicationId]
      if (chatRoom && roomChannelsRef.current[chatRoom.id]) {
        try {
          supabase.removeChannel(roomChannelsRef.current[chatRoom.id])
        } catch (e) {
          console.warn('Failed to remove channel for room', chatRoom.id, e)
        }
        delete roomChannelsRef.current[chatRoom.id]
      }
    }
  }, [])

  // Subscribe helper
  const subscribeToRoom = useCallback((roomId: string) => {
    if (!roomId) return
    if (roomChannelsRef.current[roomId]) return

    const channel = supabase
      .channel(`messages-room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_room_id=eq.${roomId}` },
        async (payload) => {
          const newMessage = payload.new as any
          // Append immediately for instant UI update
          setMessages(prev => {
            const existing = prev[roomId] || []
            if (existing.some(m => m.id === newMessage.id)) return prev
            return {
              ...prev,
              [roomId]: [...existing, { ...newMessage }]
            }
          })

          // Try to enrich sender but don't block UI
          try {
            const { data: sender } = await supabase
              .from('users')
              .select('id, full_name, avatar_url')
              .eq('id', newMessage.sender_id)
              .single()
            if (sender) {
              setMessages(prev => {
                const existing = prev[roomId] || []
                return {
                  ...prev,
                  [roomId]: existing.map(m => m.id === newMessage.id ? { ...m, sender: { id: sender.id, full_name: sender.full_name ?? undefined, avatar_url: sender.avatar_url ?? undefined } } : m)
                }
              })
            }
          } catch (e) {
            // ignore enrichment errors
          }
        }
      )
      .subscribe()

    roomChannelsRef.current[roomId] = channel
  }, [supabase])

  // When chatRooms map changes, ensure subscriptions exist for rooms with open tabs
  useEffect(() => {
    chatTabs.forEach(tab => {
      const room = chatRooms[tab.applicationId]
      if (room) {
        subscribeToRoom(room.id)
      }
    })
  }, [chatRooms, chatTabs, subscribeToRoom])

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      Object.values(roomChannelsRef.current).forEach(channel => {
        try { supabase.removeChannel(channel) } catch {}
      })
      roomChannelsRef.current = { }
    }
  }, [supabase])

  // Auto-scroll to bottom when messages update for a room
  useEffect(() => {
    // Only scroll open, non-minimized tabs
    openTabs.forEach(tab => {
      const room = chatRooms[tab.applicationId]
      if (!room) return
      const endRef = messageEndRefs.current[room.id]
      if (endRef) {
        endRef.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    })
  }, [messages, chatRooms])

  const openTabs = chatTabs.filter(tab => tab.isOpen && !tab.isMinimized)
  const minimizedTabs = chatTabs.filter(tab => tab.isMinimized)

  console.log('Chat tabs state:', {
    total: chatTabs.length,
    open: openTabs.length,
    minimized: minimizedTabs.length,
    tabs: chatTabs.map(tab => ({
      id: tab.id,
      title: tab.title,
      isOpen: tab.isOpen,
      isMinimized: tab.isMinimized,
      wouldBeOpen: tab.isOpen && !tab.isMinimized,
      wouldBeMinimized: tab.isMinimized
    }))
  })

  if (chatTabs.length === 0) return null

  return (
    <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-50">
      {/* Minimized Tabs */}
      {minimizedTabs.length > 0 && (
        <div className="flex flex-col gap-2 mb-2">
          {minimizedTabs.map((tab) => (
            <Button
              key={tab.id}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 min-w-0 bg-white shadow-lg"
              onClick={() => toggleMinimize(tab.id)}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="truncate max-w-20">{tab.title}</span>
              {tab.unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 text-xs">
                  {tab.unreadCount}
                </Badge>
              )}
              <X 
                className="h-4 w-4 ml-1" 
                onClick={(e) => {
                  e.stopPropagation()
                  closeChat(tab.id)
                }}
              />
            </Button>
          ))}
        </div>
      )}

      {/* Open Chat Tabs */}
      {openTabs.length > 0 && (
        <div className="flex flex-col gap-2">
          {openTabs.map((tab) => {
            const chatRoom = chatRooms[tab.applicationId]
            const chatMessages = chatRoom ? messages[chatRoom.id] || [] : []

            return (
              <div key={tab.id} className="flex-shrink-0">
                <Card className="w-72 sm:w-80 md:w-96 h-72 sm:h-80 md:h-96 flex flex-col shadow-xl border-0">
                  <CardHeader className="p-3 pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium truncate">
                        {tab.title}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-blue-100"
                          onClick={() => toggleMinimize(tab.id)}
                        >
                          <Minimize2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-red-100"
                          onClick={() => closeChat(tab.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3 pt-0 flex-1 flex flex-col min-h-0">
                    {/* Messages */}
                    <ScrollArea className="flex-1">
                       <div className="space-y-2 pr-2">
                        {chatMessages.map((message: Message) => (
                          <MessageBubble 
                            key={message.id} 
                            message={message} 
                            isOwnMessage={currentUser === message.sender_id}
                          />
                        ))}
                        {chatMessages.length === 0 && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            No messages yet
                          </div>
                        )}
                         <div ref={(el) => {
                           const room = chatRooms[tab.applicationId]
                           if (room) messageEndRefs.current[room.id] = el
                         }} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="flex gap-2">
                      <Input
                        value={newMessages[tab.applicationId] || ''}
                        onChange={(e) => setNewMessages(prev => ({
                          ...prev,
                          [tab.applicationId]: e.target.value
                        }))}
                        onKeyPress={(e) => handleKeyPress(e, tab.applicationId)}
                        placeholder="Type a message..."
                        className="flex-1 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => sendMessage(tab.applicationId)}
                        disabled={!newMessages[tab.applicationId]?.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Message Bubble Component
function MessageBubble({ 
  message, 
  isOwnMessage 
}: { 
  message: Message
  isOwnMessage: boolean
}) {
  const senderName = message.sender?.full_name || `User ${message.sender_id.slice(0, 8)}`
  const avatarUrl = message.sender?.avatar_url || '/defaultAvatar.png'

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2 max-w-[80%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarImage 
            src={avatarUrl} 
            alt={senderName}
          />
          <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
            {senderName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className={`rounded-lg px-3 py-2 text-sm ${
          isOwnMessage 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          <div className="font-medium text-xs mb-1">
            {senderName}
          </div>
          <div>{message.content}</div>
        </div>
      </div>
    </div>
  )
} 