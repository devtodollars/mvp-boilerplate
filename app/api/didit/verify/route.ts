import { NextRequest, NextResponse } from 'next/server'
import { diditAPI, diditHelpers } from '@/utils/didit'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, redirectPath, email } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    
        // Get user profile from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('id', userId)
      .single()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is already verified
    if (user.verified) {
      return NextResponse.json({ 
        success: true, 
        message: 'User is already verified',
        verified: true 
      })
    }

    // Set redirect URL for when verification completes
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/account/profile?verification=success&userId=${user.id}`

    // Initiate verification with Didit
    const verificationRequest = {
      userId: user.id,
      email: email || '',
      firstName: user.first_name,
      lastName: user.last_name,
      redirectUrl,
    }

        // Call the actual Didit API to create verification session
    const response = await diditAPI.createVerificationSession(verificationRequest)
    
    if (!response.success) {
      return NextResponse.json({ 
        error: 'Failed to initiate verification',
        details: response.error 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: response.verificationUrl,
      verificationId: response.verificationId,
    })

  } catch (error) {
    console.error('Verification initiation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// Handle GET requests for verification status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const verificationId = searchParams.get('verificationId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get user verification status
    const { data: user, error } = await supabase
      .from('users')
      .select('verified')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      verified: user.verified,
      userId,
    })

  } catch (error) {
    console.error('Verification status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
