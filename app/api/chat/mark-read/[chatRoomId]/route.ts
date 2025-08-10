import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatRoomId: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatRoomId } = await params

    // Directly update messages to mark them as read instead of using RPC
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('chat_room_id', chatRoomId)
      .neq('sender_id', user.id) // Don't mark own messages as read
      .is('read_at', null) // Only update unread messages

    if (error) {
      console.error('Error marking messages as read:', error)
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in mark-read API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 