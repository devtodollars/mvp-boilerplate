import { createClient } from '@/utils/supabase/server'
import { parseNaturalLanguageQuery } from '@/components/search/AISearchLogic'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || 'single room in dublin'
  
  const supabase = await createClient()
  
  try {
    // Get all listings
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .eq('active', true)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Parse the search query
    const parsedFilters = parseNaturalLanguageQuery(query)
    console.log('Parsed filters:', parsedFilters)

    // Check if we have structured filters
    const hasStructuredFilters = parsedFilters && (
      parsedFilters.roomType || 
      parsedFilters.propertyType || 
      parsedFilters.county || 
      parsedFilters.location ||
      parsedFilters.amenities?.length ||
      parsedFilters.pets ||
      parsedFilters.ensuite
    )

    // Apply the same filtering logic as the search component
    let filtered = [...(listings || [])]
    
    // Apply search query first - but only if no structured filters
    if (query && !hasStructuredFilters) {
      const lowerQuery = query.toLowerCase()
      console.log('Applying search query filter:', lowerQuery)
      
      const beforeSearch = filtered.length
      filtered = filtered.filter(listing => 
        listing.property_name?.toLowerCase().includes(lowerQuery) ||
        listing.address?.toLowerCase().includes(lowerQuery) ||
        listing.city?.toLowerCase().includes(lowerQuery) ||
        listing.area?.toLowerCase().includes(lowerQuery) ||
        listing.description?.toLowerCase().includes(lowerQuery)
      )
      console.log(`Search filter: ${beforeSearch} -> ${filtered.length}`)
    } else if (hasStructuredFilters) {
      console.log('Skipping text search because we have structured filters:', parsedFilters)
    }

    // Apply parsed filters
    if (parsedFilters.roomType) {
      console.log('Applying room type filter:', parsedFilters.roomType)
      const beforeRoomFilter = filtered.length
      filtered = filtered.filter(listing => {
        console.log(`Listing ${listing.id}: room_type = "${listing.room_type}", looking for "${parsedFilters.roomType}"`)
        return listing.room_type === parsedFilters.roomType
      })
      console.log(`Room type filter: ${beforeRoomFilter} -> ${filtered.length}`)
    }

    if (parsedFilters.county) {
      console.log('Applying county filter:', parsedFilters.county)
      const beforeCountyFilter = filtered.length
      filtered = filtered.filter(listing => {
        console.log(`Listing ${listing.id}: county = "${listing.county}", looking for "${parsedFilters.county}"`)
        return listing.county === parsedFilters.county
      })
      console.log(`County filter: ${beforeCountyFilter} -> ${filtered.length}`)
    }

    if (parsedFilters.location) {
      console.log('Applying location filter:', parsedFilters.location)
      const beforeLocationFilter = filtered.length
      const location = parsedFilters.location.toLowerCase()
      filtered = filtered.filter(listing =>
        listing.address?.toLowerCase().includes(location) ||
        listing.city?.toLowerCase().includes(location) ||
        listing.area?.toLowerCase().includes(location)
      )
      console.log(`Location filter: ${beforeLocationFilter} -> ${filtered.length}`)
    }

    return NextResponse.json({
      query,
      parsed_filters: parsedFilters,
      total_listings: listings?.length || 0,
      filtered_count: filtered.length,
      filtered_listings: filtered,
      all_listings: listings
    })
    
  } catch (error) {
    console.error('Filter test error:', error)
    return NextResponse.json({ 
      error: 'Filter test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 