"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Send, 
  ArrowLeft, 
  MessageSquare, 
  User, 
  Building2,
  Loader2,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"

interface Message {
  id: string
  content: string
  sender_id: string
  message_type: 'text' | 'system'
  created_at: string
  read_at: string | null
  sender?: {
    id: string
    full_name?: string
    avatar_url?: string
  }
}

interface ChatRoomProps {
  applicationId: string
  listingName: string
  applicantName: string
  onClose: () => void
}

export default function ChatRoom({ applicationId, listingName, applicantName, onClose }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [chatRoomId, setChatRoomId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Memoize the Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), [])
  
  // Keep a reference to the realtime channel so we can clean it up
  const realtimeChannelRef = useRef<any>(null)
  const { toast } = useToast()

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize chat room and load messages
  useEffect(() => {
    initializeChat()
  }, [applicationId])

  const initializeChat = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get or create chat room
      const response = await fetch(`/api/chat/rooms/${applicationId}`)
      if (!response.ok) {
        throw new Error('Failed to initialize chat room')
      }

      const { chatRoom } = await response.json()
      setChatRoomId(chatRoom.id)

      // Load messages once during init
      await loadMessages(chatRoom.id)

    } catch (error) {
      console.error('Error initializing chat:', error)
      setError('Failed to load chat. Please try again.')
      toast({
        title: "Error",
        description: "Failed to load chat messages.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (roomId: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${roomId}`)
      if (!response.ok) {
        throw new Error('Failed to load messages')
      }

      const { messages } = await response.json()
      setMessages(messages || [])
    } catch (error) {
      console.error('Error loading messages:', error)
      throw error
    }
  }

  // Set up Supabase Realtime subscription for this chat room
  const setupRealtimeSubscription = (roomId: string) => {
    // Clean up any existing channel first to avoid duplicate subscriptions
    if (realtimeChannelRef.current) {
      try {
        supabase.removeChannel(realtimeChannelRef.current)
      } catch (e) {
        console.warn('Failed to remove previous realtime channel, continuing...', e)
      }
      realtimeChannelRef.current = null
    }

    // Subscribe to new message inserts for this room
    const channel = supabase
      .channel(`messages-room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${roomId}`
        },
        async (payload) => {
          const newMessage = payload.new as any
          // Append immediately to avoid missing updates if enrichment fails
          setMessages(prev => {
            const alreadyExists = prev.some(m => m.id === newMessage.id)
            if (alreadyExists) return prev
            return [...prev, { ...newMessage } as Message]
          })
          scrollToBottom()

          // Best-effort enrichment of sender details
          try {
            const { data: sender } = await supabase
              .from('users')
              .select('id, full_name, avatar_url')
              .eq('id', newMessage.sender_id)
              .single()

            if (sender) {
              setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, sender: { id: sender.id, full_name: sender.full_name ?? undefined, avatar_url: sender.avatar_url ?? undefined } } : m))
            }
          } catch (e) {
            // Non-fatal: keep the message without sender details
          }
        }
      )
      .subscribe()

    realtimeChannelRef.current = channel

    // Return cleanup function
    return () => {
      try {
        if (realtimeChannelRef.current) {
          supabase.removeChannel(realtimeChannelRef.current)
          realtimeChannelRef.current = null
        }
      } catch (e) {
        console.warn('Failed to clean up realtime channel', e)
      }
    }
  }

  // Manage subscription lifecycle when chatRoomId becomes available
  useEffect(() => {
    if (!chatRoomId) return
    const cleanup = setupRealtimeSubscription(chatRoomId)
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatRoomId])

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatRoomId || sending) return

    try {
      setSending(true)
      const response = await fetch(`/api/chat/messages/${chatRoomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newMessage.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const { message } = await response.json()
      setMessages(prev => [...prev, message])
      setNewMessage("")

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
        variant: "default",
      })

    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto h-[600px]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>Chat</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading chat...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto h-[600px]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>Chat</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={initializeChat} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col">
      {/* Header */}
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-lg">{listingName}</CardTitle>
              <p className="text-sm text-gray-600">Chat with {applicantName}</p>
            </div>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {messages.length} messages
          </Badge>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0 min-h-0 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 pr-2">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No messages yet</p>
                <p className="text-sm text-gray-500">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || sending}
            size="sm"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Message Bubble Component
function MessageBubble({ message }: { message: Message }) {
  // Memoize the Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), [])
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [senderProfile, setSenderProfile] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user?.id || null)
    }
    getUser()
  }, [supabase])

  useEffect(() => {
    const getSenderProfile = async () => {
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, avatar_url')
        .eq('id', message.sender_id)
        .single()
      setSenderProfile(profile)
    }
    getSenderProfile()
  }, [message.sender_id, supabase])

  const isOwnMessage = currentUser === message.sender_id
  const senderName = senderProfile?.full_name || message.sender?.full_name || `User ${message.sender_id.slice(0, 8)}`
  const avatarUrl = senderProfile?.avatar_url || message.sender?.avatar_url || '/defaultAvatar.png'

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} w-full`}>
      <div className={`flex gap-2 w-full max-w-[400px] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage 
            src={avatarUrl} 
            alt={senderName}
          />
          <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
            {senderName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          <div className={`rounded-lg px-3 py-2 w-full max-w-[320px] break-words whitespace-pre-wrap ${
            isOwnMessage 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            <p className="text-sm">{message.content}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">
              {format(new Date(message.created_at), 'HH:mm')}
            </span>
            {message.read_at && (
              <span className="text-xs text-blue-600">✓ Read</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 