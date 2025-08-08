import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string } }
) {
  try {
    const path = params.path
    const bucket = request.nextUrl.searchParams.get('bucket') || 'listing-images'
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get the file from Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)

    if (error) {
      console.error('Error fetching image:', error)
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Convert the file to buffer
    const arrayBuffer = await data.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create response with caching headers
    const response = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': data.type || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'ETag': `"${path}-${Date.now()}"`,
        'Last-Modified': new Date().toUTCString(),
      },
    })

    return response
  } catch (error) {
    console.error('Error in image API route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 