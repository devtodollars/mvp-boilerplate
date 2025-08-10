import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { chatRoomId: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatRoomId } = params

    // Call the mark_messages_as_read function
    const { error } = await supabase.rpc('mark_messages_as_read', {
      chat_room_uuid: chatRoomId
    })

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