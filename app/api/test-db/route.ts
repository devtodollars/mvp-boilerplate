import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (testError) {
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: testError 
      }, { status: 500 })
    }
    
    // Test applications table access
    const { data: appsData, error: appsError } = await supabase
      .from('applications')
      .select('id')
      .limit(1)
    
    if (appsError) {
      return NextResponse.json({ 
        error: 'Applications table access failed', 
        details: appsError 
      }, { status: 500 })
    }
    
    // Test listings table access
    const { data: listingsData, error: listingsError } = await supabase
      .from('listings')
      .select('id')
      .limit(1)
    
    if (listingsError) {
      return NextResponse.json({ 
        error: 'Listings table access failed', 
        details: listingsError 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      usersCount: testData?.length || 0,
      applicationsCount: appsData?.length || 0,
      listingsCount: listingsData?.length || 0
    })
    
  } catch (error) {
    console.error('Test DB error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 