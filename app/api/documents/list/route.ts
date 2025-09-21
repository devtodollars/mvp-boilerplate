import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Documents list API called')
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Auth check:', { user: user?.id, authError: authError?.message })
    
    if (authError || !user) {
      console.log('Authentication failed')
      return NextResponse.json(
        { error: 'Authentication required', details: authError?.message },
        { status: 401 }
      )
    }

    console.log('Attempting to list documents for user:', user.id)

    // List documents using server-side client (bypasses RLS issues)
    const { data, error } = await supabase.storage
      .from('user-documents')
      .list(user.id, {
        limit: 100,
        offset: 0,
      })

    console.log('Storage list result:', { 
      success: !error, 
      documentsCount: data?.length || 0, 
      error: error?.message,
      fullError: error 
    })

    if (error) {
      console.error('List documents error:', error)
      // Return empty array instead of error to gracefully handle storage issues
      return NextResponse.json({ 
        documents: [], 
        error: error.message,
        debug: 'Storage error occurred'
      })
    }

    return NextResponse.json({ 
      documents: data || [], 
      debug: 'Success',
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Document list API error:', error)
    // Return empty array instead of error for graceful degradation
    return NextResponse.json({ 
      documents: [], 
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: 'Catch block error'
    })
  }
}