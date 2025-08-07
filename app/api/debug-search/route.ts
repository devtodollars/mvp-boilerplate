import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  try {
    // Get all listings with their key searchable fields
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, property_name, room_type, property_type, city, county, address, monthly_rent, active')
      .eq('active', true)
      .limit(10)
    
    if (error) {
      console.error('Error fetching listings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get unique values for debugging
    const roomTypes = Array.from(new Set(listings?.map(l => l.room_type).filter(Boolean)))
    const propertyTypes = Array.from(new Set(listings?.map(l => l.property_type).filter(Boolean)))
    const counties = Array.from(new Set(listings?.map(l => l.county).filter(Boolean)))
    const cities = Array.from(new Set(listings?.map(l => l.city).filter(Boolean)))

    return NextResponse.json({
      total_listings: listings?.length || 0,
      listings: listings || [],
      unique_values: {
        room_types: roomTypes,
        property_types: propertyTypes,
        counties: counties,
        cities: cities
      }
    })
    
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 