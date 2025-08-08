import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Get the listing ID from params (await params first)
    const { id: listingId } = await params;
    
    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Increment the views count for this listing
    const { data, error } = await supabase.rpc('increment_listing_views', {
      listing_uuid: listingId
    });

    if (error) {
      console.error('Error incrementing views:', error);
      return NextResponse.json(
        { error: 'Failed to increment views' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      views_count: data 
    });

  } catch (error) {
    console.error('Error in view tracking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 