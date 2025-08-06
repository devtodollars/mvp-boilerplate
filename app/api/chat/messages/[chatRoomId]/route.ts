import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatRoomId: string }> }
) {
  try {
    const { chatRoomId } = await params
    const supabase = await createClient()

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get messages with sender details
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('chat_room_id', chatRoomId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatRoomId: string }> }
) {
  try {
    const { chatRoomId } = await params
    const { content } = await request.json()
    const supabase = await createClient()

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        chat_room_id: chatRoomId,
        sender_id: user.id,
        content: content.trim()
      })
      .select(`
        *,
        sender:users(
          id,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (insertError) {
      console.error('Error inserting message:', insertError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Send message API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 