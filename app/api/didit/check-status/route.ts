import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get user verification status
    const { data: user, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, verified')
      .eq('id', userId)
      .single()
    
    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        verified: user.verified
      }
    })
    
  } catch (error) {
    console.error('Check status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
