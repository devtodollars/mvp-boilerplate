'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
  Send,
  Search,
  User,
  Building2
} from 'lucide-react'

interface ChatTab {
  id: string
  applicationId: string
  title: string
  isOpen: boolean
  unreadCount: number
  otherPartyName: string
  propertyName: string
  role: 'applicant' | 'owner' // Whether user is applicant or property owner
  applicationStatus: string // Current application status
  lastMessage?: string // Last message content
  lastMessageTime?: string // Last message timestamp
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

export default function ChatTabs({ onUnreadCountChange }: { onUnreadCountChange?: (count: number) => void }) {
  const [chatTabs, setChatTabs] = useState<ChatTab[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [newMessages, setNewMessages] = useState<Record<string, string>>({})
  const [chatRooms, setChatRooms] = useState<Record<string, ChatRoom>>({})
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  // Track which application/chat is selected to view on the right pane
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)
  // Controls visibility of the unified chat panel
  const [isPanelOpen, setIsPanelOpen] = useState(false) // Closed by default to prevent auth issues

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = useMemo(() => createClient(), [])
  // Keep realtime channels per chat_room_id
  const roomChannelsRef = useRef<Record<string, any>>({})
  // Keep bottom sentinels per chat_room_id for autoscroll
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
      console.log('Calculating unread count for application:', applicationId, 'user:', currentUserId)

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUserId)
        .eq('type', 'message')
        .eq('data->>application_id', applicationId)

      if (error) {
        console.error('Error counting notifications:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        return 0
      }

      console.log('Unread count for application', applicationId, ':', count)
      return count || 0
    } catch (error) {
      console.error('Error calculating unread count:', error)
      return 0
    }
  }, [supabase])

  // Mark messages as read for a chat room
  const markMessagesAsRead = useCallback(async (chatRoomId: string) => {
    try {
      console.log('Attempting to mark messages as read for chat room:', chatRoomId)

      const response = await fetch(`/api/chat/mark-read/${chatRoomId}`, {
        method: 'POST'
      })

      if (!response.ok) {
        console.error('Failed to mark messages as read:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      } else {
        console.log('Successfully marked messages as read for chat room:', chatRoomId)
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }, [])

  // Delete notifications for a specific chat room
  const deleteChatNotifications = useCallback(async (chatRoomId: string) => {
    try {
      console.log('Attempting to delete chat notifications for chat room:', chatRoomId)

      const response = await fetch(`/api/notifications/delete-chat/${chatRoomId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        console.error('Failed to delete chat notifications:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      } else {
        console.log('Successfully deleted chat notifications for chat room:', chatRoomId)
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
      // Step 1: applicant-side applications (include all statuses for ongoing conversations)
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

      if (applicantError) {
        console.error('Error fetching applications (applicant):', applicantError)
      }
      if (listingsError) {
        console.error('Error fetching owned listings:', listingsError)
      }

      // Step 2: owner-side applications for owned listing ids (include all statuses)
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
      if (allApps.length === 0) return []

      // Step 3: Get chat room data for each application (this already has user names!)
      const chatRoomPromises = allApps.map(async (app) => {
        try {
          const response = await fetch(`/api/chat/rooms/${app.id}`)
          const data = await response.json()
          if (data.error) {
            console.error('Error getting chat room for app:', app.id, data.error)
            return null
          }
          return { applicationId: app.id, chatRoom: data.chatRoom }
        } catch (error) {
          console.error('Error fetching chat room for app:', app.id, error)
          return null
        }
      })

      const chatRoomResults = await Promise.all(chatRoomPromises)
      const validChatRooms = chatRoomResults.filter(result => result !== null)

      console.log('Chat room results:', validChatRooms)

      // Create tabs for each application using chat room data
      const newTabsPromises = validChatRooms.map(async ({ applicationId, chatRoom }) => {
        const isOwner = chatRoom.owner_id === currentUser

        // Get the actual name of the other party from chat room data
        let otherPartyName = ''
        if (isOwner) {
          // User is property owner, so other party is applicant
          otherPartyName = chatRoom.applicant?.full_name || 'New Applicant'
        } else {
          // User is applicant, so other party is property owner
          otherPartyName = chatRoom.owner?.full_name || 'Property Owner'
        }

        const propertyName = chatRoom.application?.listing?.property_name || 'Property'

        console.log(`Creating tab for app ${applicationId}:`, {
          isOwner,
          otherPartyName,
          propertyName,
          applicant: chatRoom.applicant,
          owner: chatRoom.owner
        })

        // Calculate unread count for this chat room
        const unreadCount = await calculateUnreadCount(applicationId, currentUser || '')

        return {
          id: `tab-${applicationId}`,
          applicationId,
          title: `${otherPartyName} - ${propertyName}`,
          isOpen: false,
          unreadCount,
          otherPartyName,
          propertyName,
          role: (isOwner ? 'owner' : 'applicant') as 'owner' | 'applicant',
          applicationStatus: chatRoom.application?.status || 'pending'
        }
      })

      const finalTabs = await Promise.all(newTabsPromises)

      console.log('📋 Setting chat tabs state with', finalTabs.length, 'tabs')
      setChatTabs(prev => {
        // Merge with existing tabs, preserving state
        const existingTabs = new Map(prev.map(tab => [tab.id, tab]))

        // Merge existing state with new data
        const mergedTabs = finalTabs
          .filter((tab, index, arr) => arr.findIndex(t => t.id === tab.id) === index) // dedupe by id
          .map(tab => ({
            ...tab,
            ...existingTabs.get(tab.id)
          }))

        console.log('📋 Chat tabs state updated:', mergedTabs.map(t => ({
          id: t.id,
          otherPartyName: t.otherPartyName,
          propertyName: t.propertyName
        })))

        return mergedTabs
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
      console.log('User loaded, fetching active applications...')
      fetchActiveApplications().then(tabs => {
        console.log('Fetched tabs with names:', tabs.map(t => ({
          id: t.id,
          otherPartyName: t.otherPartyName,
          propertyName: t.propertyName
        })))
      })
    } else {
      setChatTabs([])
    }
  }, [currentUser, fetchActiveApplications])

  // Prevent body scroll when chat panel is open
  useEffect(() => {
    if (isPanelOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isPanelOpen])

  // Load messages for a chat room
  const loadMessages = useCallback(async (chatRoomId: string) => {
    console.log('🚀 loadMessages called for room:', chatRoomId, 'caller:', new Error().stack?.split('\n')[2]?.trim())

    // Prevent duplicate calls for the same room
    if (messages[chatRoomId] && messages[chatRoomId].length > 0) {
      console.log('✅ Messages already loaded for room:', chatRoomId, 'skipping load')
      return
    }

    try {
      console.log('📡 Making API call for room:', chatRoomId)
      const response = await fetch(`/api/chat/messages/${chatRoomId}`)
      const data = await response.json()

      if (data.error) {
        console.error('Error loading messages:', data.error)
        return
      }

      const messages = data.messages || []
      console.log('💬 Setting messages state for room:', chatRoomId, 'message count:', messages.length)
      setMessages(prev => ({
        ...prev,
        [chatRoomId]: messages
      }))

      // Update last message and time for the chat tab
      if (messages.length > 0) {
        // Find the application ID for this chat room
        const applicationId = Object.keys(chatRooms).find(key =>
          chatRooms[key].id === chatRoomId
        )

        if (applicationId) {
          setChatTabs(prev => prev.map(tab => {
            if (tab.applicationId === applicationId) {
              return {
                ...tab,
                lastMessage: messages[messages.length - 1]?.content,
                lastMessageTime: messages[messages.length - 1]?.created_at
              }
            }
            return tab
          }))
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [chatRooms])

  // Load recent messages for all conversations to populate last message data
  // Only run this once when chatTabs are first loaded, not every time chatRooms change
  useEffect(() => {
    console.log('🔍 useEffect for loading messages triggered:', {
      chatTabsLength: chatTabs.length,
      chatRoomsLength: Object.keys(chatRooms).length,
      currentUser: !!currentUser,
      timestamp: new Date().toISOString()
    })

    if (chatTabs.length > 0 && Object.keys(chatRooms).length > 0 && currentUser) {
      // Only load messages for tabs that don't have lastMessage AND don't already have messages loaded
      const loadedRooms = new Set<string>()

      chatTabs.forEach(async tab => {
        const chatRoom = chatRooms[tab.applicationId]
        if (chatRoom && !tab.lastMessage && !loadedRooms.has(chatRoom.id)) {
          // Check if messages are already loaded for this room
          if (!messages[chatRoom.id] || messages[chatRoom.id].length === 0) {
            loadedRooms.add(chatRoom.id)
            console.log('📥 Loading messages for room:', chatRoom.id, 'from useEffect')
            await loadMessages(chatRoom.id)
          } else {
            console.log('📥 Skipping room', chatRoom.id, 'messages already loaded')
          }
        }
      })
    }
  }, [chatTabs, currentUser]) // Removed chatRooms and loadMessages dependencies

  // Get or create chat room
  const getChatRoom = useCallback(async (applicationId: string): Promise<{ id: string, chatRoom: ChatRoom } | null> => {
    console.log('🏠 getChatRoom called for application:', applicationId, 'at:', new Date().toISOString())
    try {
      console.log('🏠 Making API call to get chat room for:', applicationId)
      const response = await fetch(`/api/chat/rooms/${applicationId}`)
      const data = await response.json()

      if (data.error) {
        console.error('Error getting chat room:', data.error)
        return null
      }

      const chatRoom = data.chatRoom
      console.log('🏠 Chat room data received:', chatRoom.id)
      console.log('🏠 Setting chatRooms state for application:', applicationId, 'room:', chatRoom.id)
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
    console.log('🚪🚪🚪 OPENCHAT STARTED for application:', applicationId, 'at:', new Date().toISOString())
    console.log('🚪 Current state - chatTabs:', chatTabs.length, 'chatRooms:', Object.keys(chatRooms).length, 'messages:', Object.keys(messages).length)

    if (!currentUser) {
      console.log('Current user not loaded yet, waiting...')
      return
    }

    // Check if we already have the chat room data
    let chatRoom = chatRooms[applicationId]
    let chatRoomId: string

    if (chatRoom) {
      // We already have the chat room, use it
      chatRoomId = chatRoom.id
      console.log('🚪 Using existing chat room data:', chatRoom.id)
    } else {
      // Get or create the chat room
      console.log('🚪 Fetching new chat room data for:', applicationId)
      const result = await getChatRoom(applicationId)
      if (!result) {
        console.error('Failed to get chat room for application:', applicationId)
        return
      }
      chatRoom = result.chatRoom
      chatRoomId = result.id
      console.log('🚪 Fetched new chat room data:', chatRoom.id)
    }

    console.log('🚪 Chat room ID determined:', chatRoomId)

    // Find the corresponding chat tab to get the correct names
    const existingTab = chatTabs.find(tab => tab.applicationId === applicationId)
    console.log('🚪 Looking for existing tab:', applicationId, 'found:', !!existingTab)

    if (existingTab) {
      // Use the existing tab data which has the correct names
      const otherPartyName = existingTab.otherPartyName
      const propertyName = existingTab.propertyName
      const role = existingTab.role
      const applicationStatus = existingTab.applicationStatus

      console.log('🚪 Using existing tab data:', { otherPartyName, propertyName, role, applicationStatus, unreadCount: existingTab.unreadCount })

      // Mark selected
      console.log('🚪 Setting selected application ID:', applicationId)
      setSelectedApplicationId(applicationId)
      console.log('🚪 Updating chat tabs - setting isOpen for:', applicationId)
      setChatTabs(prev => prev.map(tab =>
        tab.applicationId === applicationId
          ? { ...tab, isOpen: true }
          : { ...tab, isOpen: false }
      ))

      // Load messages only if we don't already have them
      console.log('🚪 About to check if messages need loading for room:', chatRoomId)
      console.log('🚪 Current messages state:', { hasMessages: !!messages[chatRoomId], messageCount: messages[chatRoomId]?.length || 0 })

      if (!messages[chatRoomId] || messages[chatRoomId].length === 0) {
        console.log('🔄 Calling loadMessages from openChat for room:', chatRoomId)
        await loadMessages(chatRoomId)
      } else {
        console.log('✅ Messages already loaded for chat room:', chatRoomId)
      }

      // Mark messages as read and delete notifications only if there are unread messages
      console.log('🚪 Checking unread count:', existingTab.unreadCount, 'for room:', chatRoomId)

      if (existingTab.unreadCount > 0) {
        console.log('🚪 Unread messages found, marking as read for chat room:', chatRoomId)
        await markMessagesAsRead(chatRoomId)

        console.log('🚪 Deleting chat notifications for chat room:', chatRoomId)
        await deleteChatNotifications(chatRoomId)
      } else {
        console.log('🚪 No unread messages, skipping mark-as-read and notification deletion')
      }

      // Update unread count to 0 for this chat
      console.log('🚪 Setting unread count to 0 for application:', applicationId)
      setChatTabs(prev => prev.map(tab =>
        tab.applicationId === applicationId
          ? { ...tab, unreadCount: 0 }
          : tab
      ))

      // Subscribe to realtime for this room
      console.log('🚪 Subscribing to realtime for room:', chatRoomId)
      subscribeToRoom(chatRoomId)
      console.log('🚪🚪🚪 OPENCHAT COMPLETED for existing tab')
      return
    }

    // If no existing tab, determine the other party's name from application data
    // This should only happen for new chats
    console.log('🚪 No existing tab found, creating new chat')
    const isOwner = chatRoom.owner_id === currentUser
    const otherPartyName = isOwner
      ? (chatRoom.applicant?.full_name || 'Unknown Applicant')
      : (chatRoom.owner?.full_name || 'Unknown Property Owner')
    const propertyName = chatRoom.application?.listing?.property_name || 'Unknown Property'

    console.log('🚪 Chat title will be:', `${otherPartyName} - ${propertyName}`)

    // Mark selected and ensure only this tab is open
    console.log('🚪 Creating new tab and setting selected application ID:', applicationId)
    setSelectedApplicationId(applicationId)
    setChatTabs(prev => {
      const newTab: ChatTab = {
        id: `tab-${applicationId}`,
        applicationId,
        title: `${otherPartyName} - ${propertyName}`,
        isOpen: true,
        unreadCount: 0, // New chat, no unread messages
        otherPartyName,
        propertyName,
        role: isOwner ? 'owner' : 'applicant',
        applicationStatus: 'pending' // Default status for new chats
      }
      console.log('🚪 New tab created:', newTab.id)
      return prev.map(t => ({ ...t, isOpen: false })).concat(newTab)
    })

    // Load messages only if we don't already have them
    console.log('🚪 About to check if messages need loading for new chat room:', chatRoomId)
    console.log('🚪 Current messages state for new chat:', { hasMessages: !!messages[chatRoomId], messageCount: messages[chatRoomId]?.length || 0 })

    if (!messages[chatRoomId] || messages[chatRoomId].length === 0) {
      console.log('🔄 Calling loadMessages from openChat for new chat room:', chatRoomId)
      await loadMessages(chatRoomId)
    } else {
      console.log('✅ Messages already loaded for new chat room:', chatRoomId)
    }

    // Subscribe to realtime for this room
    console.log('🚪 Subscribing to realtime for new chat room:', chatRoomId)
    subscribeToRoom(chatRoomId)
    console.log('🚪🚪🚪 OPENCHAT COMPLETED for new chat')
  }, [getChatRoom, currentUser, loadMessages, chatTabs, markMessagesAsRead, deleteChatNotifications])

  // Listen for open chat events
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent) => {
      const { applicationId, showPanel } = event.detail
      console.log('Received openChat event:', { applicationId, showPanel })



      // If specific application is provided, open it
      if (applicationId) {
        console.log('Opening specific chat for application:', applicationId)
        setIsPanelOpen(true) // Open the panel
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
      } else if (showPanel && chatTabs.length > 0 && !selectedApplicationId) {
        // If just opening panel and no chat selected, select the first available one
        console.log('Selecting first available chat...')
        setIsPanelOpen(true) // Open the panel
        setSelectedApplicationId(chatTabs[0].applicationId)
        openChat(chatTabs[0].applicationId)
      }
    }

    window.addEventListener('openChat' as any, handleOpenChat)
    return () => window.removeEventListener('openChat' as any, handleOpenChat)
  }, [currentUser, openChat, chatTabs.length, selectedApplicationId])

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
      // If we closed the selected tab, select the next available (if any)
      setSelectedApplicationId(prevSelected => {
        if (prevSelected === tab.applicationId) {
          const remaining = chatTabs.filter(t => t.id !== tabId)
          return remaining.length > 0 ? remaining[0].applicationId : null
        }
        return prevSelected
      })
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
  }, [supabase, currentUser, calculateUnreadCount])

  // When chatRooms map changes, ensure subscriptions exist for rooms with open tabs
  useEffect(() => {
    console.log('🔌 useEffect for subscriptions triggered:', {
      chatTabsLength: chatTabs.length,
      chatRoomsLength: Object.keys(chatRooms).length,
      timestamp: new Date().toISOString()
    })

    // Only subscribe to rooms that don't already have subscriptions
    chatTabs.forEach(tab => {
      const room = chatRooms[tab.applicationId]
      if (room && !roomChannelsRef.current[room.id]) {
        console.log('📡 Subscribing to room:', room.id)
        subscribeToRoom(room.id)
      }
    })
  }, [chatRooms, chatTabs, subscribeToRoom])

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      Object.values(roomChannelsRef.current).forEach(channel => {
        try { supabase.removeChannel(channel) } catch { }
      })
      roomChannelsRef.current = {}
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

  // Filter conversations based on search query
  const filteredChatTabs = chatTabs.filter(tab =>
    searchQuery === '' ||
    tab.otherPartyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tab.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tab.applicationStatus.toLowerCase().includes(searchQuery.toLowerCase())
  )

  console.log('Filtered chat tabs:', filteredChatTabs.map(tab => ({
    id: tab.id,
    otherPartyName: tab.otherPartyName,
    propertyName: tab.propertyName,
    role: tab.role
  })))

  const openTabs = chatTabs.filter(tab => tab.isOpen)
  const selectedTab = selectedApplicationId
    ? chatTabs.find(t => t.applicationId === selectedApplicationId)
    : openTabs[0]

  console.log('Chat tabs state:', {
    total: chatTabs.length,
    open: openTabs.length,
    tabs: chatTabs.map(tab => ({
      id: tab.id,
      title: tab.title,
      isOpen: tab.isOpen
    }))
  })



  // Don't render anything if user is not authenticated
  if (!currentUser) {
    return null
  }

  return (
    <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-50">
      {/* Single Chat Window with Conversation List */}
      {/* DONT ADD ANY ICON OR BUTTON ! */}
      {isPanelOpen && (
        <div
          className="overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <Card className="w-[95vw] sm:w-[800px] md:w-[900px] lg:w-[1000px] h-[500px] sm:h-[600px] max-h-[80vh] flex flex-col shadow-xl border-0 overflow-hidden">
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
              {/* Left: conversation list - organized by role */}
              <div className="w-full sm:w-80 sm:border-r border-b sm:border-b-0 bg-gray-50 h-full flex flex-col flex-shrink-0 min-w-0 max-w-80">
                <div className="p-3 border-b bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Conversations</h3>
                    <p className="text-xs text-gray-500">
                      {searchQuery ? `${filteredChatTabs.length} of ${chatTabs.length}` : `${chatTabs.length} total`}
                    </p>
                  </div>
                  {/* Search bar */}
                  <div className="relative">
                    <Input
                      placeholder="Search conversations..."
                      className="h-8 text-xs pr-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-3">
                    {/* Property Owner Section */}
                    {filteredChatTabs.filter(item => item.role === 'owner').length > 0 && (
                      <div>
                        <div className="px-2 py-1 mb-2">
                          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                            <Building2 className="h-3 w-3" />
                            My Properties
                          </h4>
                        </div>
                        <div className="space-y-1">
                          {filteredChatTabs.filter(item => item.role === 'owner').map(item => (
                            <button
                              key={item.id}
                              className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-200 hover:bg-white hover:shadow-sm ${item.applicationId === selectedApplicationId
                                ? 'bg-white shadow-sm border-l-4 border-blue-500'
                                : item.unreadCount > 0
                                  ? 'bg-blue-50 border-l-2 border-blue-300 hover:bg-blue-100'
                                  : 'hover:border-l-2 hover:border-gray-200'
                                }`}
                              onClick={() => openChat(item.applicationId)}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className={`truncate ${item.unreadCount > 0 ? 'font-semibold text-blue-900' : 'font-medium text-gray-900'}`}>
                                  {item.otherPartyName}
                                </div>
                                {item.unreadCount > 0 && (
                                  <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex-shrink-0">
                                    {item.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate leading-tight mb-1">
                                {item.propertyName}
                              </div>
                              {item.lastMessage && (
                                <div className="text-xs text-gray-600 truncate leading-tight mb-1">
                                  {item.lastMessage}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={item.applicationStatus === 'accepted' ? 'default' :
                                    item.applicationStatus === 'pending' ? 'secondary' :
                                      item.applicationStatus === 'rejected' ? 'destructive' : 'outline'}
                                  className="text-xs h-4 px-2"
                                >
                                  {item.applicationStatus}
                                </Badge>
                                <Badge variant="outline" className="text-xs h-4 px-2 text-blue-600 border-blue-200">
                                  {item.role === 'owner' ? 'Applicant' : 'Property Owner'}
                                </Badge>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Applicant Section */}
                    {filteredChatTabs.filter(item => item.role === 'applicant').length > 0 && (
                      <div>
                        <div className="px-2 py-1 mb-2">
                          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                            <User className="h-3 w-3" />
                            My Applications
                          </h4>
                        </div>
                        <div className="space-y-1">
                          {filteredChatTabs.filter(item => item.role === 'applicant').map(item => (
                            <button
                              key={item.id}
                              className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-200 hover:bg-white hover:shadow-sm ${item.applicationId === selectedApplicationId
                                ? 'bg-white shadow-sm border-l-4 border-blue-500'
                                : item.unreadCount > 0
                                  ? 'bg-blue-50 border-l-2 border-blue-300 hover:bg-blue-100'
                                  : 'hover:border-l-2 hover:border-gray-200'
                                }`}
                              onClick={() => openChat(item.applicationId)}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className={`truncate ${item.unreadCount > 0 ? 'font-semibold text-blue-900' : 'font-medium text-gray-900'}`}>
                                  {item.otherPartyName}
                                </div>
                                {item.unreadCount > 0 && (
                                  <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex-shrink-0">
                                    {item.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate leading-tight mb-1">
                                {item.propertyName}
                              </div>
                              {item.lastMessage && (
                                <div className="text-xs text-gray-600 truncate leading-tight mb-1">
                                  {item.lastMessage}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={item.applicationStatus === 'accepted' ? 'default' :
                                    item.applicationStatus === 'pending' ? 'secondary' :
                                      item.applicationStatus === 'rejected' ? 'destructive' : 'outline'}
                                  className="text-xs h-4 px-2"
                                >
                                  {item.applicationStatus}
                                </Badge>
                                <Badge variant="outline" className="text-xs h-4 px-2 text-blue-600 border-blue-200">
                                  {item.role === 'owner' ? 'Applicant' : 'Property Owner'}
                                </Badge>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredChatTabs.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          {searchQuery ? 'No conversations found' : 'No conversations yet'}
                        </p>
                        <p className="text-xs">
                          {searchQuery ? 'Try adjusting your search terms' : 'Start chatting with applicants or property owners'}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Right: message thread - FIXED WIDTH */}
              <div className="w-full sm:w-[calc(100%-20rem)] lg:w-[calc(100%-22rem)] flex flex-col min-h-0 flex-shrink-0">
                <div className="p-3 pb-0 text-sm font-medium truncate min-w-0 max-w-full border-b">
                  {selectedTab?.title || 'Select a conversation'}
                </div>
                <div className="flex-1 min-h-0 flex flex-col">
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-3 pr-2 min-w-0">
                      {(() => {
                        const chatRoom = selectedTab ? chatRooms[selectedTab.applicationId] : undefined
                        const chatMessages = chatRoom ? (messages[chatRoom.id] || []) : []
                        return chatMessages.length > 0 ? (
                          chatMessages.map((message: Message) => (
                            <MessageBubble
                              key={message.id}
                              message={message}
                              isOwnMessage={currentUser === message.sender_id}
                            />
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            {selectedTab ? 'No messages yet' : 'Choose a chat to start'}
                          </div>
                        )
                      })()}
                      <div ref={(el) => {
                        const room = selectedTab ? chatRooms[selectedTab.applicationId] : undefined
                        if (room) messageEndRefs.current[room.id] = el
                      }} />
                    </div>
                  </ScrollArea>

                  {/* Message input */}
                  {selectedTab && (
                    <div className="flex gap-2 p-3 border-t bg-gray-50">
                      <Input
                        value={newMessages[selectedTab.applicationId] || ''}
                        onChange={(e) => setNewMessages(prev => ({
                          ...prev,
                          [selectedTab.applicationId]: e.target.value
                        }
                        ))}
                        onKeyPress={(e) => handleKeyPress(e, selectedTab.applicationId)}
                        placeholder="Type a message..."
                        className="flex-1 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => sendMessage(selectedTab.applicationId)}
                        disabled={!newMessages[selectedTab.applicationId]?.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
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

// Message Bubble Component with fixed width
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
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} w-full`}>
      <div className={`flex items-start gap-2 w-full max-w-[400px] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Only show avatar for messages from other person */}
        {!isOwnMessage && (
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarImage
              src={avatarUrl}
              alt={senderName}
            />
            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
              {senderName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}
        <div className={`flex flex-col min-w-0 flex-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          <div className={`rounded-lg px-3 py-2 text-sm break-words whitespace-pre-wrap w-full max-w-[320px] ${isOwnMessage
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-900'
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