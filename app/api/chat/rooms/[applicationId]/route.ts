import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params
    const supabase = await createClient()

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get application details
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        user_id,
        listing:listings(
          id,
          property_name,
          address,
          user_id
        )
      `)
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      console.error('Error getting application:', appError)
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Check if user has access to this application
    const isOwner = application.listing?.user_id === user.id
    const isApplicant = application.user_id === user.id
    
    if (!isOwner && !isApplicant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get or create chat room
    let { data: chatRoom, error: chatRoomError } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('application_id', applicationId)
      .single()

    if (chatRoomError && chatRoomError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error getting chat room:', chatRoomError)
      return NextResponse.json({ error: 'Failed to get chat room' }, { status: 500 })
    }

    if (!chatRoom) {
      // Create new chat room
      const { data: newChatRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({
          application_id: applicationId,
          owner_id: application.listing?.user_id || '',
          applicant_id: application.user_id
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating chat room:', createError)
        return NextResponse.json({ error: 'Failed to create chat room' }, { status: 500 })
      }

      chatRoom = newChatRoom
    }

    // Get chat room details with user info
    const { data: chatRoomDetails, error: detailsError } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        application:applications(
          id,
          status,
          listing:listings(
            id,
            property_name,
            address
          )
        ),
        owner:users!chat_rooms_owner_id_fkey(
          id,
          full_name,
          avatar_url
        ),
        applicant:users!chat_rooms_applicant_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('id', chatRoom.id)
      .single()

    if (detailsError) {
      console.error('Error fetching chat room details:', detailsError)
      return NextResponse.json({ error: 'Failed to get chat room details' }, { status: 500 })
    }

    return NextResponse.json({ chatRoom: chatRoomDetails })
  } catch (error) {
    console.error('Chat room API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 