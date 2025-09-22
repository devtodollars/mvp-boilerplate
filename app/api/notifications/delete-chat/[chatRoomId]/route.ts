import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/utils/supabase/serverApiAuth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatRoomId: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get current user with caching
    const { user, error: authError } = await getApiUser(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatRoomId } = await params

    // Get the application ID for this chat room
    const { data: chatRoom, error: chatError } = await supabase
      .from('chat_rooms')
      .select('application_id')
      .eq('id', chatRoomId)
      .single()

    if (chatError || !chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 })
    }

    // Delete notifications of type 'message' for this application
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .eq('type', 'message')
      .eq('data->>application_id', chatRoom.application_id)

    if (deleteError) {
      console.error('Error deleting notifications:', deleteError)
      return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete-chat-notifications API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 