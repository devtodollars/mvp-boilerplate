import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Update user verification status
    const { error } = await supabase
      .from('users')
      .update({ verified: true })
      .eq('id', userId)
    
    if (error) {
      console.error('Failed to update user verification status:', error)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `User ${userId} marked as verified` 
    })
    
  } catch (error) {
    console.error('Test update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
