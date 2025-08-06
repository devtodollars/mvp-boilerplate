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

// Update a listing
export const updateListing = async (
  listingId: string,
  listing: Database['public']['Tables']['listings']['Update'],
  newImages: File[],
  newVideos: File[]
) => {
  const supabase = createClient();
  try {
    // Upload new images and videos if any
    let newImageUrls: string[] = [];
    let newVideoUrls: string[] = [];
    
    if (newImages.length > 0) {
      newImageUrls = await uploadListingMedia(newImages, 'listing-images');
    }
    if (newVideos.length > 0) {
      newVideoUrls = await uploadListingMedia(newVideos, 'listing-videos');
    }

    // Get existing media URLs
    const { data: existingListing } = await supabase
      .from('listings')
      .select('images, videos')
      .eq('id', listingId)
      .single();

    // Combine existing and new media
    const existingImages = Array.isArray(existingListing?.images) ? existingListing.images : [];
    const existingVideos = Array.isArray(existingListing?.videos) ? existingListing.videos : [];
    const allImages = [...existingImages, ...newImageUrls];
    const allVideos = [...existingVideos, ...newVideoUrls];

    // Update the listing
    const { data, error } = await supabase
      .from('listings')
      .update({
        ...listing,
        images: allImages,
        videos: allVideos,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Get a single listing by ID
export const getListingById = async (listingId: string) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .single();

  return { data, error };
}; 