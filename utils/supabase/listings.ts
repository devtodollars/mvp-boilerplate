import { createClient } from './client';
import type { Database } from '@/types_db';

// Helper to upload files to a Supabase Storage bucket and return public URLs
export async function uploadListingMedia(files: File[], bucket: string): Promise<string[]> {
  const supabase = createClient();
  const urls: string[] = [];
  for (const file of files) {
    const filePath = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    urls.push(data.publicUrl);
  }
  return urls;
}

// Create a listing with media upload
export async function createListing(
  listing: Database['public']['Tables']['listings']['Insert'],
  images: File[],
  videos: File[]
) {
  const supabase = createClient();
  try {
    // Upload images and videos
    const imageUrls = images.length ? await uploadListingMedia(images, 'listing-images') : [];
    const videoUrls = videos.length ? await uploadListingMedia(videos, 'listing-videos') : [];
    // Insert listing
    const { data, error } = await supabase.from('listings').insert([
      {
        ...listing,
        images: imageUrls,
        videos: videoUrls,
      },
    ]).select().single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export const fetchListings = async () => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  return { data, error };
};

export const debugListings = async () => {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      return { success: false, listings: [] };
    }

    return { success: true, listings: data || [] };
  } catch (error) {
    console.error('Error in debugListings:', error);
    return { success: false, listings: [] };
  }
};

// Track a view for a listing
export const trackListingView = async (listingId: string) => {
  try {
    const response = await fetch(`/api/listings/${listingId}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to track view');
    }

    const result = await response.json();
    return { success: true, views_count: result.views_count };
  } catch (error) {
    console.error('Error tracking view:', error);
    return { success: false, error };
  }
};

// Get listing stats (applicants and views)
export const getListingStats = async (listingId: string) => {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.rpc('get_listing_stats', {
      listing_uuid: listingId
    });

    if (error) {
      console.error('Error getting listing stats:', error);
      return { success: false, applicant_count: 0, views_count: 0 };
    }

    if (data && data.length > 0) {
      return { 
        success: true, 
        applicant_count: data[0].applicant_count || 0,
        views_count: data[0].views_count || 0,
        last_viewed_at: data[0].last_viewed_at
      };
    }

    return { success: true, applicant_count: 0, views_count: 0 };
  } catch (error) {
    console.error('Error in getListingStats:', error);
    return { success: false, applicant_count: 0, views_count: 0 };
  }
};

// Get applicant count for a listing
export const getListingApplicantCount = async (listingId: string) => {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.rpc('get_listing_applicant_count', {
      listing_uuid: listingId
    });

    if (error) {
      console.error('Error getting applicant count:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error in getListingApplicantCount:', error);
    return 0;
  }
}; 