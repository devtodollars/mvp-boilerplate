import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the document name from the request body
    const { documentName } = await request.json()
    
    if (!documentName) {
      return NextResponse.json(
        { error: 'Document name is required' },
        { status: 400 }
      )
    }

    // Delete from storage using server-side client (bypasses RLS issues)
    const { error: storageError } = await supabase.storage
      .from('user-documents')
      .remove([`${user.id}/${documentName}`])

    if (storageError) {
      console.error('Delete error:', storageError)
      return NextResponse.json(
        { error: `Delete failed: ${storageError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Document delete API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}