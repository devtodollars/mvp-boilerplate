import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getApiUser } from '@/utils/supabase/serverApiAuth';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { listingId, notes } = await request.json();

    // Get the current user with caching
    const { user, error: userError } = await getApiUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Apply to property using the database function
    const { data, error } = await supabase.rpc('add_application_to_queue', {
      listing_uuid: listingId,
      user_uuid: user.id,
      application_notes: notes || null
    });

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'You have already applied to this property' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      applicationId: data
    });

  } catch (error) {
    console.error('Application error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    // Get the current user with caching
    const { user, error: userError } = await getApiUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    if (listingId) {
      // Get applications for a specific listing (owner only)
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('user_id')
        .eq('id', listingId)
        .single();

      if (listingError) {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        );
      }

      if (listing.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized: You can only view applications for your own listings' },
          { status: 403 }
        );
      }

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          user:users(
            id,
            first_name,
            last_name,
            email,
            phone,
            bio,
            occupation
          )
        `)
        .eq('listing_id', listingId)
        .order('position', { ascending: true });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        applications: data
      });
    } else {
      // Get user's own applications
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          listing:listings(
            id,
            property_name,
            address,
            city,
            county,
            monthly_rent,
            property_type,
            room_type,
            images
          )
        `)
        .eq('user_id', user.id)
        .order('applied_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        applications: data
      });
    }

  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 