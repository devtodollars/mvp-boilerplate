import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    console.log('Didit webhook received:', payload)
    
    // Handle different webhook payload formats
    let userId, status
    
    if (payload.vendor_data && payload.status) {
      // New format from Didit
      userId = payload.vendor_data
      status = payload.status
    } else if (payload.user_id && payload.status) {
      // Alternative format
      userId = payload.user_id
      status = payload.status
    } else {
      console.error('Invalid webhook payload:', payload)
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }

    console.log(`Processing verification for user ${userId}, status: ${status}`)
    
    if (status === 'approved' || status === 'completed' || status === 'success') {
      // Update user verification status in database
      const supabase = await createClient()
      
      const { error } = await supabase
        .from('users')
        .update({ verified: true })
        .eq('id', userId)
      
      if (error) {
        console.error('Failed to update user verification status:', error)
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }
      
      console.log(`User ${userId} verified successfully`)
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle GET requests for webhook verification (if required by Didit)
export async function GET() {
  return NextResponse.json({ message: 'Didit webhook endpoint is active' })
}
