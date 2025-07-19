import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Fetch all listings
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching listings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('API route fetched listings:', data?.length || 0)
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 