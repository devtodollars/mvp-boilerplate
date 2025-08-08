import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the listing data
    const { data: listing, error } = await supabase
      .from('listings')
      .select('*')
      .limit(1)
      .single()
    
    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch listing', 
        details: error 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      listing: {
        id: listing.id,
        property_name: listing.property_name,
        address: listing.address,
        lat: listing.lat,
        lng: listing.lng,
        monthly_rent: listing.monthly_rent,
        hasCoordinates: typeof listing.lat === 'number' && typeof listing.lng === 'number'
      }
    })
    
  } catch (error) {
    console.error('Test listing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 