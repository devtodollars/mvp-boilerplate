import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
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

    // Download from storage using server-side client (bypasses RLS issues)
    const { data, error } = await supabase.storage
      .from('user-documents')
      .download(`${user.id}/${documentName}`)

    if (error || !data) {
      console.error('Download error:', error)
      return NextResponse.json(
        { error: `Download failed: ${error?.message || 'File not found'}` },
        { status: 500 }
      )
    }

    // Convert blob to base64 for JSON response
    const arrayBuffer = await data.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    return NextResponse.json({ 
      success: true, 
      data: base64,
      contentType: data.type || 'application/octet-stream'
    })

  } catch (error) {
    console.error('Document download API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}