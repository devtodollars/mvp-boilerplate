import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        authError: authError?.message
      })
    }

    console.log('User authenticated:', user.id)

    // Try to list documents with detailed error info
    try {
      const { data, error } = await supabase.storage
        .from('user-documents')
        .list(user.id, {
          limit: 10,
          offset: 0,
        })

      console.log('Storage list result:', { data, error })

      return NextResponse.json({
        success: !error,
        userId: user.id,
        documentsCount: data?.length || 0,
        documents: data || [],
        error: error?.message || null,
        fullError: error || null
      })

    } catch (storageError) {
      console.error('Storage operation failed:', storageError)
      return NextResponse.json({
        success: false,
        userId: user.id,
        error: 'Storage operation failed',
        details: storageError instanceof Error ? storageError.message : String(storageError)
      })
    }

  } catch (error) {
    console.error('API test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}