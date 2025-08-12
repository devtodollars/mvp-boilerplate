'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MessageSquare,
  X,
  Send,
  Search,
  Building2,
  Home
} from 'lucide-react'

interface ChatTab {
  id: string
  applicationId: string
  title: string
  isOpen: boolean
  unreadCount: number
  otherPartyName: string
  propertyName: string
  role: 'applicant' | 'owner'
  applicationStatus: string
  lastMessage?: string
  lastMessageTime?: string
  propertyId?: string
}

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  read_at?: string | null
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
      property_name: string
      address: string
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

interface GroupedConversation {
  id: string
  title: string
  type: 'property' | 'application'
  conversations: ChatTab[]
  totalUnread: number
  lastActivity: string
  status?: string
}

export default function ChatTabs({ onUnreadCountChange }: { onUnreadCountChange?: (count: number) => void }) {
  const [chatTabs, setChatTabs] = useState<ChatTab[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [newMessages, setNewMessages] = useState<Record<string, string>>({})
  const [chatRooms, setChatRooms] = useState<Record<string, ChatRoom>>({})
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'properties' | 'applications'>('properties')
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = useMemo(() => createClient(), [])
  const roomChannelsRef = useRef<Record<string, any>>({})
  const messageEndRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Calculate total unread count for notifications
  const totalUnreadCount = useMemo(() => {
    return chatTabs.reduce((total, tab) => total + (tab.unreadCount || 0), 0)
  }, [chatTabs])

  // Notify parent of unread count changes
  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(totalUnreadCount)
    }
  }, [totalUnreadCount, onUnreadCountChange])

  // Calculate unread count for a specific chat room from notifications table
  const calculateUnreadCount = useCallback(async (applicationId: string, currentUserId: string) => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUserId)
        .eq('type', 'message')
        .eq('data->>application_id', applicationId)

      if (error) {
        console.error('Error counting notifications:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error calculating unread count:', error)
      return 0
    }
  }, [supabase])

  // Mark messages as read for a chat room
  const markMessagesAsRead = useCallback(async (chatRoomId: string) => {
    try {
      const response = await fetch(`/api/chat/mark-read/${chatRoomId}`, {
        method: 'POST'
      })

      if (!response.ok) {
        console.error('Failed to mark messages as read:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }, [])

  // Delete notifications for a specific chat room
  const deleteChatNotifications = useCallback(async (chatRoomId: string) => {
    try {
      const response = await fetch(`/api/notifications/delete-chat/${chatRoomId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        console.error('Failed to delete chat notifications:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error deleting chat notifications:', error)
    }
  }, [])

  // Get current user
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user?.id || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Fetch user's active applications and chat rooms
  const fetchActiveApplications = useCallback(async (): Promise<ChatTab[]> => {
    if (!currentUser) return []

    try {
      const [{ data: applicantApps, error: applicantError }, { data: ownedListings, error: listingsError }] = await Promise.all([
        supabase
          .from('applications')
          .select('id,status,user_id,listing_id')
          .in('status', ['pending', 'accepted', 'rejected', 'withdrawn'])
          .eq('user_id', currentUser),
        supabase
          .from('listings')
          .select('id, user_id, property_name, address')
          .eq('user_id', currentUser)
      ])

      if (applicantError || listingsError) {
        console.error('Error fetching data:', { applicantError, listingsError })
      }

      let ownerApps: any[] = []
      const ownedListingIds = (ownedListings || []).map((l: any) => l.id)
      if (ownedListingIds.length > 0) {
        const { data: ownerAppsData, error: ownerError } = await supabase
          .from('applications')
          .select('id,status,user_id,listing_id')
          .in('status', ['pending', 'accepted', 'rejected', 'withdrawn'])
          .in('listing_id', ownedListingIds)

        if (ownerError) {
          console.error('Error fetching owner applications:', ownerError)
        }
        ownerApps = ownerAppsData || []
      }

      const allApps = [...(applicantApps || []), ...ownerApps]
      if (allApps.length === 0) return []

      // Get chat rooms for all applications
      const chatRoomPromises = allApps.map(async (app) => {
        try {
          const response = await fetch(`/api/chat/rooms/${app.id}`)
          const data = await response.json()
          if (data.error) return null
          return { applicationId: app.id, chatRoom: data.chatRoom }
        } catch (error) {
          console.error('Error fetching chat room for app:', app.id, error)
          return null
        }
      })

      const chatRoomResults = await Promise.all(chatRoomPromises)
      const validChatRooms = chatRoomResults.filter(result => result !== null)

      // Create tabs with unread counts
      const newTabsPromises = validChatRooms.map(async ({ applicationId, chatRoom }) => {
        const isOwner = chatRoom.owner_id === currentUser
        const otherPartyName = isOwner
          ? (chatRoom.applicant?.full_name || 'New Applicant')
          : (chatRoom.owner?.full_name || 'Property Owner')
        const propertyName = chatRoom.application?.listing?.property_name || 'Property'
        const unreadCount = await calculateUnreadCount(applicationId, currentUser)

        return {
          id: `tab-${applicationId}`,
          applicationId,
          title: `${otherPartyName} - ${propertyName}`,
          isOpen: false,
          unreadCount,
          otherPartyName,
          propertyName,
          role: (isOwner ? 'owner' : 'applicant') as 'owner' | 'applicant',
          applicationStatus: chatRoom.application?.status || 'pending',
          propertyId: chatRoom.application?.listing?.id
        }
      })

      const finalTabs = await Promise.all(newTabsPromises)

      // Update state efficiently
      setChatTabs(prev => {
        const existingTabs = new Map(prev.map(tab => [tab.id, tab]))
        return finalTabs
          .filter((tab, index, arr) => arr.findIndex(t => t.id === tab.id) === index)
          .map(tab => ({
            ...tab,
            ...existingTabs.get(tab.id)
          }))
      })

      return finalTabs
    } catch (error) {
      console.error('Error in fetchActiveApplications:', error)
      return []
    }
  }, [currentUser, calculateUnreadCount])

  // Fetch applications when user changes
  useEffect(() => {
    if (currentUser) {
      fetchActiveApplications()
    } else {
      setChatTabs([])
    }
  }, [currentUser, fetchActiveApplications])

  // Prevent body scroll when chat panel is open
  // Event handlers to prevent scroll conflicts
  const handleWheelEvent = (e: React.WheelEvent) => {
    // Stop wheel events from bubbling to the main page
    e.stopPropagation()
  }

  const handleTouchEvent = (e: React.TouchEvent) => {
    // Stop touch events from bubbling to the main page
    e.stopPropagation()
  }

  // Track which rooms we've already loaded messages for
  const loadedRoomsRef = useRef<Set<string>>(new Set())

  // Reset loaded rooms when user changes
  useEffect(() => {
    loadedRoomsRef.current.clear()
  }, [currentUser])

  // Smart message loading: Only load when needed and prevent infinite loops
  const loadMessagesForTab = useCallback(async (applicationId: string) => {
    const chatRoom = chatRooms[applicationId]
    if (!chatRoom || loadedRoomsRef.current.has(chatRoom.id)) {
      return
    }

    loadedRoomsRef.current.add(chatRoom.id)
    console.log(`📥 Loading messages for tab: ${applicationId}, room: ${chatRoom.id}`)

    try {
      const response = await fetch(`/api/chat/messages/${chatRoom.id}`)
      const data = await response.json()
      if (data.messages && data.messages.length > 0) {
        setMessages(prev => ({
          ...prev,
          [chatRoom.id]: data.messages
        }))
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [chatRooms])

  // Load messages for a specific room ID
  const loadMessagesForRoom = useCallback(async (roomId: string) => {
    if (loadedRoomsRef.current.has(roomId)) {
      return
    }

    loadedRoomsRef.current.add(roomId)
    console.log(`📥 Loading messages for room: ${roomId}`)

    try {
      const response = await fetch(`/api/chat/messages/${roomId}`)
      const data = await response.json()
      if (data.messages && data.messages.length > 0) {
        setMessages(prev => ({
          ...prev,
          [roomId]: data.messages
        }))
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [])

  // Load messages for existing chats when they become available
  useEffect(() => {
    if (!currentUser || chatTabs.length === 0 || Object.keys(chatRooms).length === 0) {
      return
    }

    // Only load messages for tabs that don't have them yet
    chatTabs.forEach(tab => {
      const chatRoom = chatRooms[tab.applicationId]
      if (chatRoom && !loadedRoomsRef.current.has(chatRoom.id)) {
        // Load messages in background without blocking
        void loadMessagesForTab(tab.applicationId)
      }
    })
  }, [currentUser, chatTabs, chatRooms, loadMessagesForTab])

  // Send message
  const sendMessage = useCallback(async (chatRoomId: string, content: string): Promise<Message | null> => {
    try {
      const response = await fetch(`/api/chat/messages/${chatRoomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      const data = await response.json()

      if (data.error) {
        console.error('Error sending message:', data.error)
        return null
      }

      return data.message
    } catch (error) {
      console.error('Error sending message:', error)
      return null
    }
  }, [])



  // Clear new message input
  const clearNewMessage = useCallback((applicationId: string) => {
    setNewMessages(prev => ({
      ...prev,
      [applicationId]: ''
    }))
  }, [])

  // Update new message input
  const updateNewMessage = useCallback((applicationId: string, value: string) => {
    setNewMessages(prev => ({
      ...prev,
      [applicationId]: value
    }))
  }, [])

  // Subscribe to room
  const subscribeToRoom = useCallback((roomId: string) => {
    if (!roomId || roomChannelsRef.current[roomId]) return

    const channel = supabase
      .channel(`messages-room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_room_id=eq.${roomId}` },
        async (payload) => {
          const newMessage = payload.new as any

          // Check if message already exists to prevent duplicates
          setMessages(prev => {
            const existing = prev[roomId] || []
            if (existing.some(m => m.id === newMessage.id)) return prev

            // Add the new message
            const updatedMessages = [...existing, { ...newMessage }]

            // Try to enrich sender immediately
            if (!newMessage.sender) {
              // Enrich sender in background
              void supabase
                .from('users')
                .select('id, full_name, avatar_url')
                .eq('id', newMessage.sender_id)
                .single()
                .then(({ data: sender, error }) => {
                  if (error) {
                    console.warn('Failed to enrich sender:', error)
                    return
                  }
                  if (sender) {
                    setMessages(prev => {
                      const current = prev[roomId] || []
                      return {
                        ...prev,
                        [roomId]: current.map(m =>
                          m.id === newMessage.id
                            ? { ...m, sender: { id: sender.id, full_name: sender.full_name ?? undefined, avatar_url: sender.avatar_url ?? undefined } }
                            : m
                        )
                      }
                    })
                  }
                })
            }

            return {
              ...prev,
              [roomId]: updatedMessages
            }
          })

          // If this is the first message for this room, load existing messages
          if (!loadedRoomsRef.current.has(roomId)) {
            console.log(`🔄 First message received for room ${roomId}, loading existing messages...`)
            void loadMessagesForRoom(roomId)
          }

          // Update unread count for the chat tab if message is from someone else
          if (newMessage.sender_id !== currentUser) {
            // Find the application ID for this chat room
            const applicationId = Object.keys(chatRooms).find(key =>
              chatRooms[key].id === roomId
            )

            if (applicationId) {
              setChatTabs(prev => prev.map(tab => {
                if (tab.applicationId === applicationId) {
                  return {
                    ...tab,
                    unreadCount: tab.unreadCount + 1,
                    lastMessage: newMessage.content,
                    lastMessageTime: newMessage.created_at
                  }
                }
                return tab
              }))
            }
          }
        }
      )
      .subscribe()

    roomChannelsRef.current[roomId] = channel
  }, [supabase, currentUser, chatRooms, loadMessagesForRoom])

  // Unsubscribe from room
  const unsubscribeFromRoom = useCallback((roomId: string) => {
    if (roomChannelsRef.current[roomId]) {
      try {
        supabase.removeChannel(roomChannelsRef.current[roomId])
      } catch (e) {
        console.warn('Failed to remove channel for room', roomId, e)
      }
      delete roomChannelsRef.current[roomId]
    }
  }, [supabase])

  // Cleanup function
  const cleanup = useCallback(() => {
    Object.values(roomChannelsRef.current).forEach(channel => {
      try { supabase.removeChannel(channel) } catch { }
    })
    roomChannelsRef.current = {}
  }, [supabase])

  // Update chat tabs
  const updateChatTabs = useCallback((updater: (prev: ChatTab[]) => ChatTab[]) => {
    setChatTabs(updater)
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

  // Load messages for a chat room
  const loadMessages = useCallback(async (chatRoomId: string): Promise<Message[]> => {
    try {
      const response = await fetch(`/api/chat/messages/${chatRoomId}`)
      const data = await response.json()

      if (data.error) {
        console.error('Error loading messages:', data.error)
        return []
      }

      return data.messages || []
    } catch (error) {
      console.error('Error loading messages:', error)
      return []
    }
  }, [])





  // Update messages state
  const updateMessages = useCallback((roomId: string, newMessages: Message[]) => {
    setMessages(prev => ({
      ...prev,
      [roomId]: newMessages
    }))
  }, [])

  // Open chat functionality
  const openChat = useCallback(async (applicationId: string) => {
    if (!currentUser) return

    let chatRoom = chatRooms[applicationId]
    let chatRoomId: string

    if (chatRoom) {
      chatRoomId = chatRoom.id
    } else {
      const result = await getChatRoom(applicationId)
      if (!result) return
      chatRoom = result.chatRoom
      chatRoomId = result.id
      setChatRooms(prev => ({ ...prev, [applicationId]: chatRoom }))
    }

    const existingTab = chatTabs.find(tab => tab.applicationId === applicationId)

    if (existingTab) {
      setSelectedApplicationId(applicationId)
      setChatTabs(prev => prev.map(tab =>
        tab.applicationId === applicationId
          ? { ...tab, isOpen: true }
          : { ...tab, isOpen: false }
      ))

      // Load messages if needed
      if (!messages[chatRoomId] || messages[chatRoomId].length === 0) {
        const messagesData = await loadMessages(chatRoomId)
        updateMessages(chatRoomId, messagesData)
      }

      // Handle unread messages
      if (existingTab.unreadCount > 0) {
        await markMessagesAsRead(chatRoomId)
        await deleteChatNotifications(chatRoomId)
      }

      setChatTabs(prev => prev.map(tab =>
        tab.applicationId === applicationId
          ? { ...tab, unreadCount: 0 }
          : tab
      ))

      subscribeToRoom(chatRoomId)
    } else {
      // Handle new chat creation
      const isOwner = chatRoom.owner_id === currentUser
      const otherPartyName = isOwner
        ? (chatRoom.applicant?.full_name || 'Unknown Applicant')
        : (chatRoom.owner?.full_name || 'Unknown Property Owner')
      const propertyName = chatRoom.application?.listing?.property_name || 'Unknown Property'

      setSelectedApplicationId(applicationId)
      setChatTabs(prev => {
        const newTab: ChatTab = {
          id: `tab-${applicationId}`,
          applicationId,
          title: `${otherPartyName} - ${propertyName}`,
          isOpen: true,
          unreadCount: 0,
          otherPartyName,
          propertyName,
          role: isOwner ? 'owner' : 'applicant',
          applicationStatus: 'pending',
          propertyId: chatRoom.application?.listing?.id
        }
        return prev.map(t => ({ ...t, isOpen: false })).concat(newTab)
      })

      if (!messages[chatRoomId] || messages[chatRoomId].length === 0) {
        const messagesData = await loadMessages(chatRoomId)
        updateMessages(chatRoomId, messagesData)
      }

      subscribeToRoom(chatRoomId)
    }
  }, [currentUser, chatRooms, chatTabs, getChatRoom, setChatRooms, updateChatTabs, updateMessages, loadMessages, markMessagesAsRead, deleteChatNotifications, subscribeToRoom])

  // Handle open chat events
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent) => {
      const { applicationId, showPanel } = event.detail

      // Always open the panel when this event is received
      setIsPanelOpen(true)

      // If specific application is provided, open it
      if (applicationId) {
        if (!currentUser) {
          // If user isn't loaded yet, retry after a short delay
          setTimeout(() => {
            if (currentUser) {
              openChat(applicationId)
            }
          }, 1000)
          return
        }
        openChat(applicationId)
      } else if (chatTabs.length > 0 && !selectedApplicationId) {
        // If just opening panel and no chat selected, select the first available one
        setSelectedApplicationId(chatTabs[0].applicationId)
        openChat(chatTabs[0].applicationId)
      }
    }

    window.addEventListener('openChat' as any, handleOpenChat)
    return () => window.removeEventListener('openChat' as any, handleOpenChat)
  }, [currentUser, openChat, chatTabs.length, selectedApplicationId])

  // Handle message sending
  const handleSendMessage = useCallback(async (applicationId: string) => {
    const messageContent = newMessages[applicationId]?.trim()
    if (!messageContent) return

    const chatRoom = chatRooms[applicationId]
    if (!chatRoom) return

    // Send the message - it will appear via the realtime subscription
    await sendMessage(chatRoom.id, messageContent)
    clearNewMessage(applicationId)
  }, [newMessages, chatRooms, sendMessage, clearNewMessage])

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent, applicationId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(applicationId)
    }
  }, [handleSendMessage])

  // Close chat
  const closeChat = useCallback((tabId: string) => {
    const tab = chatTabs.find(t => t.id === tabId)
    if (tab) {
      const chatRoom = chatRooms[tab.applicationId]
      if (chatRoom) {
        unsubscribeFromRoom(chatRoom.id)
      }

      updateChatTabs(prev => prev.filter(t => t.id !== tabId))

      setSelectedApplicationId(prevSelected => {
        if (prevSelected === tab.applicationId) {
          const remaining = chatTabs.filter(t => t.id !== tabId)
          return remaining.length > 0 ? remaining[0].applicationId : null
        }
        return prevSelected
      })
    }
  }, [chatTabs, chatRooms, unsubscribeFromRoom, updateChatTabs])

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    const openTabs = chatTabs.filter(tab => tab.isOpen)
    openTabs.forEach(tab => {
      const room = chatRooms[tab.applicationId]
      if (room) {
        const endRef = messageEndRefs.current[room.id]
        if (endRef) {
          endRef.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
      }
    })
  }, [messages, chatRooms, chatTabs])

  // Cleanup subscriptions
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // Group conversations by property or application
  const groupedConversations = useMemo(() => {
    if (activeTab === 'properties') {
      // Group by property for owners
      const propertyGroups = new Map<string, GroupedConversation>()

      chatTabs
        .filter(tab => tab.role === 'owner')
        .forEach(tab => {
          const propertyId = tab.propertyId || tab.applicationId
          if (!propertyGroups.has(propertyId)) {
            propertyGroups.set(propertyId, {
              id: propertyId,
              title: `Property: ${tab.propertyName.split(' ').slice(0, 3).join(' ')}...`,
              type: 'property',
              conversations: [],
              totalUnread: 0,
              lastActivity: tab.lastMessageTime || '1970-01-01'
            })
          }

          const group = propertyGroups.get(propertyId)!
          group.conversations.push(tab)
          group.totalUnread += tab.unreadCount

          if (tab.lastMessageTime && tab.lastMessageTime > group.lastActivity) {
            group.lastActivity = tab.lastMessageTime
          }
        })

      return Array.from(propertyGroups.values())
        .sort((a, b) => {
          // Sort by unread count first, then by last activity
          if (a.totalUnread !== b.totalUnread) {
            return b.totalUnread - a.totalUnread
          }
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        })
    } else {
      // Group by application for applicants (only show accepted applications)
      const applicationGroups = new Map<string, GroupedConversation>()

      chatTabs
        .filter(tab => tab.role === 'applicant' && tab.applicationStatus === 'accepted')
        .forEach(tab => {
          const groupId = tab.applicationId
          if (!applicationGroups.has(groupId)) {
            applicationGroups.set(groupId, {
              id: groupId,
              title: `Listing: ${tab.propertyName.split(' ').slice(0, 3).join(' ')}...`,
              type: 'application',
              conversations: [tab],
              totalUnread: tab.unreadCount,
              lastActivity: tab.lastMessageTime || '1970-01-01',
              status: tab.applicationStatus
            })
          }
        })

      return Array.from(applicationGroups.values())
        .sort((a, b) => {
          // Sort by unread count first, then by last activity
          if (a.totalUnread !== b.totalUnread) {
            return b.totalUnread - a.totalUnread
          }
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        })
    }
  }, [chatTabs, activeTab])

  // Filter conversations based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedConversations

    return groupedConversations.filter(group =>
      group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.conversations.some(tab =>
        tab.otherPartyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tab.applicationStatus.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  }, [groupedConversations, searchQuery])

  const openTabs = chatTabs.filter(tab => tab.isOpen)
  const selectedTab = selectedApplicationId
    ? chatTabs.find(t => t.applicationId === selectedApplicationId)
    : openTabs[0]

  // Don't render if user is not authenticated
  if (!currentUser) return null

  return (
    <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-50">
      {isPanelOpen && (
        <div
          className="overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <Card
            className="w-[95vw] sm:w-[800px] md:w-[900px] lg:w-[1000px] h-[500px] sm:h-[600px] max-h-[80vh] flex flex-col shadow-xl border-0 overflow-hidden"
            onWheel={handleWheelEvent}
            onTouchMove={handleTouchEvent}
            onTouchStart={handleTouchEvent}
          >
            <CardHeader className="p-3 pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <CardTitle className="text-sm font-medium truncate flex-1 min-w-0 max-w-full">
                  {selectedTab?.title || 'Chats'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-red-100"
                  onClick={() => setIsPanelOpen(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 min-h-0 flex flex-col sm:flex-row">
              {/* Left: conversation list with tabs */}
              <div className="w-full sm:w-80 sm:border-r border-b sm:border-b-0 bg-gray-50 h-full flex flex-col flex-shrink-0 min-w-0 max-w-80">
                <div className="p-3 border-b bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Conversations</h3>
                    <p className="text-xs text-gray-500">
                      {searchQuery ? `${filteredGroups.length} of ${groupedConversations.length}` : `${groupedConversations.length} total`}
                    </p>
                  </div>

                  {/* Role-based tabs */}
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'properties' | 'applications')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-8">
                      <TabsTrigger value="properties" className="text-xs flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        My Listings
                      </TabsTrigger>
                      <TabsTrigger value="applications" className="text-xs flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        My Applications
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>


                </div>

                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-3">
                    {filteredGroups.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          {searchQuery ? 'No conversations found' : 'No conversations yet'}
                        </p>
                        <p className="text-xs">
                          {searchQuery ? 'Try adjusting your search terms' : 'Start chatting with applicants or property owners'}
                        </p>
                      </div>
                    ) : (
                      filteredGroups.map((group) => (
                        <div key={group.id} className="space-y-1">
                          {/* Group Header */}
                          <div className="px-2 py-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {/* Unread indicator for group */}
                                {group.totalUnread > 0 && (
                                  <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                                )}
                                <h4 className="text-xs font-semibold text-gray-600 truncate">
                                  {group.title}
                                </h4>
                              </div>
                              {group.totalUnread > 0 && (
                                <Badge variant="destructive" className="h-4 w-4 p-0 text-xs flex-shrink-0">
                                  {group.totalUnread > 9 ? '9+' : group.totalUnread}
                                </Badge>
                              )}
                            </div>
                            {group.type === 'application' && group.status && (
                              <Badge
                                variant={group.status === 'accepted' ? 'default' :
                                  group.status === 'pending' ? 'secondary' :
                                    group.status === 'rejected' ? 'destructive' : 'outline'}
                                className="text-xs h-3 px-1 mt-1"
                              >
                                {group.status}
                              </Badge>
                            )}
                          </div>

                          {/* Conversations in this group */}
                          <div className="space-y-1">
                            {group.conversations
                              .sort((a, b) => {
                                // Sort by unread count first, then by last message time
                                if (a.unreadCount !== b.unreadCount) {
                                  return b.unreadCount - a.unreadCount
                                }
                                const aTime = a.lastMessageTime || '1970-01-01'
                                const bTime = b.lastMessageTime || '1970-01-01'
                                return new Date(bTime).getTime() - new Date(aTime).getTime()
                              })
                              .map((tab) => (
                                <button
                                  key={tab.id}
                                  className={`w-full text-left p-2 rounded-lg text-xs transition-all duration-200 hover:bg-white hover:shadow-sm relative ${tab.applicationId === selectedApplicationId
                                    ? 'bg-white shadow-sm border-l-4 border-blue-500'
                                    : tab.unreadCount > 0
                                      ? 'bg-blue-50 border-l-2 border-blue-300 hover:bg-blue-100'
                                      : 'hover:border-l-2 hover:border-gray-200'
                                    }`}
                                  onClick={() => openChat(tab.applicationId)}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      {/* Unread indicator - standard filled circle */}
                                      {tab.unreadCount > 0 && (
                                        <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                                      )}
                                      <div className={`truncate ${tab.unreadCount > 0 ? 'font-semibold text-blue-900' : 'font-medium text-gray-900'}`}>
                                        {tab.otherPartyName}
                                      </div>
                                    </div>
                                    {tab.unreadCount > 0 && (
                                      <Badge variant="destructive" className="h-4 w-4 p-0 text-xs flex-shrink-0">
                                        {tab.unreadCount}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate leading-tight mb-1">
                                    {tab.propertyName}
                                  </div>
                                  {tab.lastMessage && (
                                    <div className="text-xs text-gray-600 truncate leading-tight">
                                      {tab.lastMessage}
                                    </div>
                                  )}
                                </button>
                              ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Right: message thread */}
              <div className="w-full sm:w-[calc(100%-20rem)] lg:w-[calc(100%-22rem)] flex flex-col min-h-0 flex-shrink-0">
                <div className="p-3 pb-0 text-sm font-medium truncate min-w-0 max-w-full border-b">
                  {selectedTab?.title || 'Select a conversation'}
                </div>
                <div className="flex-1 min-h-0 flex flex-col">
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-3 pr-2 min-w-0">
                      <MessageList
                        selectedTab={selectedTab}
                        chatRooms={chatRooms}
                        messages={messages}
                        currentUser={currentUser}
                        messageEndRefs={messageEndRefs}
                      />
                    </div>
                  </ScrollArea>

                  {/* Message input */}
                  {selectedTab && (
                    <MessageInput
                      selectedTab={selectedTab}
                      newMessages={newMessages}
                      onMessageChange={updateNewMessage}
                      onKeyPress={handleKeyPress}
                      onSend={handleSendMessage}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Extracted components for better organization
function MessageList({
  selectedTab,
  chatRooms,
  messages,
  currentUser,
  messageEndRefs
}: {
  selectedTab: ChatTab | undefined
  chatRooms: Record<string, ChatRoom>
  messages: Record<string, Message[]>
  currentUser: string | null
  messageEndRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
}) {
  const chatRoom = selectedTab ? chatRooms[selectedTab.applicationId] : undefined
  const chatMessages = chatRoom ? (messages[chatRoom.id] || []) : []

  if (chatMessages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        {selectedTab ? 'No messages yet' : 'Choose a chat to start'}
      </div>
    )
  }

  return (
    <>
      {chatMessages.map((message: Message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwnMessage={currentUser === message.sender_id}
        />
      ))}
      <div ref={(el) => {
        if (chatRoom) messageEndRefs.current[chatRoom.id] = el
      }} />
    </>
  )
}

function MessageInput({
  selectedTab,
  newMessages,
  onMessageChange,
  onKeyPress,
  onSend
}: {
  selectedTab: ChatTab
  newMessages: Record<string, string>
  onMessageChange: (applicationId: string, value: string) => void
  onKeyPress: (e: React.KeyboardEvent, applicationId: string) => void
  onSend: (applicationId: string) => void
}) {
  return (
    <div className="flex gap-2 p-3 border-t bg-gray-50">
      <Input
        value={newMessages[selectedTab.applicationId] || ''}
        onChange={(e) => onMessageChange(selectedTab.applicationId, e.target.value)}
        onKeyPress={(e) => onKeyPress(e, selectedTab.applicationId)}
        placeholder="Type a message..."
        className="flex-1 text-sm"
      />
      <Button
        size="sm"
        onClick={() => onSend(selectedTab.applicationId)}
        disabled={!newMessages[selectedTab.applicationId]?.trim()}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}

function MessageBubble({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) {
  const senderName = message.sender?.full_name || `User ${message.sender_id.slice(0, 8)}`
  const avatarUrl = message.sender?.avatar_url || '/defaultAvatar.png'

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} w-full`}>
      <div className={`flex items-start gap-2 w-full max-w-[400px] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Only show avatar for messages from other person */}
        {!isOwnMessage && (
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarImage src={avatarUrl} alt={senderName} />
            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
              {senderName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}
        <div className={`flex flex-col min-w-0 flex-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          <div className={`rounded-lg px-3 py-2 text-sm break-words whitespace-pre-wrap w-full max-w-[320px] ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'
            }`}>
            <div className="font-medium text-xs mb-1 opacity-80">
              {senderName}
            </div>
            <div className="break-words whitespace-pre-wrap leading-relaxed">{message.content}</div>
          </div>
        </div>
      </div>
    </div>
  )
}