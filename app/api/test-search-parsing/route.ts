import { parseNaturalLanguageQuery } from '@/components/search/AISearchLogic'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || 'Single Room in Dublin'
  
  try {
    const parsed = parseNaturalLanguageQuery(query)
    
    return NextResponse.json({
      query: query,
      parsed_filters: parsed,
      debug_info: {
        lower_query: query.toLowerCase(),
        contains_single_room: query.toLowerCase().includes('single room'),
        contains_dublin: query.toLowerCase().includes('dublin'),
        location_match: query.toLowerCase().match(/(?:in|at|near|around)\s+([a-zA-Z\s]+?)(?:\s|$)/)
      }
    })
    
  } catch (error) {
    console.error('Parsing error:', error)
    return NextResponse.json({ 
      error: 'Parsing failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 