import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/utils/supabase/serverApiAuth'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user with caching
    const { user, error: userError } = await getApiUser(request)
    if (userError) {
      return NextResponse.json({ error: 'User error', details: userError }, { status: 400 })
    }
    
    if (!user) {
      return NextResponse.json({ error: 'No authenticated user' }, { status: 401 })
    }
    
    // Test basic access to applications table
    const { data: testData, error: testError } = await supabase
      .from('applications')
      .select('id, status, user_id')
      .limit(5)
    
    if (testError) {
      return NextResponse.json({ 
        error: 'Test query failed', 
        details: testError,
        user: user.id 
      }, { status: 400 })
    }
    
    // Get user's applications
    const { data: userApplications, error: userAppsError } = await supabase
      .from('applications')
      .select('id, status, user_id')
      .eq('user_id', user.id)
    
    if (userAppsError) {
      return NextResponse.json({ 
        error: 'User applications query failed', 
        details: userAppsError 
      }, { status: 400 })
    }
    
    // Get applications for listings owned by user
    const { data: ownedListings, error: ownedError } = await supabase
      .from('listings')
      .select('id')
      .eq('user_id', user.id)
    
    if (ownedError) {
      return NextResponse.json({ 
        error: 'Owned listings query failed', 
        details: ownedError 
      }, { status: 400 })
    }
    
    const listingIds = ownedListings?.map((l: { id: string }) => l.id) || []
    let ownedApplications = []
    
    if (listingIds.length > 0) {
      const { data: ownedApps, error: ownedAppsError } = await supabase
        .from('applications')
        .select('id, status, user_id, listing_id')
        .in('listing_id', listingIds)
      
      if (ownedAppsError) {
        return NextResponse.json({ 
          error: 'Owned applications query failed', 
          details: ownedAppsError 
        }, { status: 400 })
      }
      
      ownedApplications = ownedApps || []
    }
    
    return NextResponse.json({
      success: true,
      user: user.id,
      testData: testData?.length || 0,
      userApplications: userApplications?.length || 0,
      ownedListings: listingIds.length,
      ownedApplications: ownedApplications.length,
      allApplications: testData?.length || 0
    })
    
  } catch (error) {
    console.error('Debug applications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 