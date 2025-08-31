import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Fetch all listings with owner information
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching listings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch owner information for each listing
    const listingsWithOwners = await Promise.all(
      (listings || []).map(async (listing) => {
        if (listing.user_id) {
          const { data: ownerData } = await supabase
            .from('users')
            .select('id, full_name, verified')
            .eq('id', listing.user_id)
            .single();
          
          return {
            ...listing,
            owner: ownerData || null
          };
        }
        return listing;
      })
    );

    // Add applicant counts and views to each listing
    const listingsWithStats = await Promise.all(
      (listingsWithOwners || []).map(async (listing) => {
        try {
          const { data: statsData, error: statsError } = await supabase.rpc('get_listing_stats', {
            listing_uuid: listing.id
          });

          if (statsError) {
            console.error(`Error getting stats for listing ${listing.id}:`, statsError);
            return {
              ...listing,
              applicants: { count: 0 },
              views_count: listing.views_count || 0
            };
          }

          const stats = statsData && statsData.length > 0 ? statsData[0] : null;
          return {
            ...listing,
            applicants: { 
              count: stats?.applicant_count || 0 
            },
            views_count: stats?.views_count || listing.views_count || 0
          };
        } catch (error) {
          console.error(`Error processing listing ${listing.id}:`, error);
          return {
            ...listing,
            applicants: { count: 0 },
            views_count: listing.views_count || 0
          };
        }
      })
    );
    
    console.log('API route fetched listings with stats:', listingsWithStats?.length || 0)
    
    return NextResponse.json({ data: listingsWithStats })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 