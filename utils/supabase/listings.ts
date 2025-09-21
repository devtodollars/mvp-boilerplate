import { createClient } from './client';
import type { Database } from '@/types_db';

// Helper to upload files to a Supabase Storage bucket and return public URLs
export async function uploadListingMedia(files: File[], bucket: string): Promise<string[]> {
  if (!files || files.length === 0) {
    return [];
  }

  if (!bucket || typeof bucket !== 'string') {
    throw new Error('Invalid bucket name provided');
  }

  const supabase = createClient();
  const urls: string[] = [];
  
  for (const file of files) {
    if (!file || !(file instanceof File)) {
      console.warn('Invalid file object provided, skipping');
      continue;
    }

    try {
      const filePath = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      
      if (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        throw error;
      }
      
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      if (data?.publicUrl) {
        urls.push(data.publicUrl);
      } else {
        console.warn(`No public URL generated for file ${file.name}`);
      }
    } catch (error) {
      console.error(`Failed to upload file ${file.name}:`, error);
      throw error;
    }
  }
  
  return urls;
}

// Create a listing with media upload
export async function createListing(
  listing: Database['public']['Tables']['listings']['Insert'],
  images: File[] = [],
  videos: File[] = []
) {
  if (!listing) {
    throw new Error('Listing data is required');
  }

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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]).select().single();
    
    if (error) {
      console.error('Error creating listing:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error creating listing:', error);
    return { data: null, error };
  }
}

export const fetchListings = async () => {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('active', true)
      .eq('payment_status', 'paid')
      .gt('payment_expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      return { data: null, error };
    }

    // Fetch owner information for each listing
    const listingsWithOwners = await Promise.all(
      (data || []).map(async (listing) => {
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

    return { data: listingsWithOwners || [], error: null };
  } catch (error) {
    console.error('Unexpected error fetching listings:', error);
    return { data: null, error };
  }
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
      return { success: false, listings: [], error };
    }

    return { success: true, listings: data || [], error: null };
  } catch (error) {
    console.error('Error in debugListings:', error);
    return { success: false, listings: [], error };
  }
};

// Track a view for a listing
export const trackListingView = async (listingId: string) => {
  if (!listingId || typeof listingId !== 'string') {
    console.error('Invalid listing ID provided');
    return { success: false, error: new Error('Invalid listing ID') };
  }

  try {
    const response = await fetch(`/api/listings/${listingId}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to track view: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return { success: true, views_count: result.views_count || 0 };
  } catch (error) {
    console.error('Error tracking view:', error);
    return { success: false, error };
  }
};

// Get listing stats (applicants and views)
export const getListingStats = async (listingId: string) => {
  if (!listingId || typeof listingId !== 'string') {
    console.error('Invalid listing ID provided');
    return { success: false, applicant_count: 0, views_count: 0, error: new Error('Invalid listing ID') };
  }

  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.rpc('get_listing_stats', {
      listing_uuid: listingId
    });

    if (error) {
      console.error('Error getting listing stats:', error);
      return { success: false, applicant_count: 0, views_count: 0, error };
    }

    if (data && data.length > 0) {
      return { 
        success: true, 
        applicant_count: data[0].applicant_count || 0,
        views_count: data[0].views_count || 0,
        last_viewed_at: data[0].last_viewed_at,
        error: null
      };
    }

    return { success: true, applicant_count: 0, views_count: 0, error: null };
  } catch (error) {
    console.error('Error in getListingStats:', error);
    return { success: false, applicant_count: 0, views_count: 0, error };
  }
};

// Get applicant count for a listing
export const getListingApplicantCount = async (listingId: string) => {
  if (!listingId || typeof listingId !== 'string') {
    console.error('Invalid listing ID provided');
    return 0;
  }

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
  newImages: File[] = [],
  newVideos: File[] = []
) => {
  if (!listingId || typeof listingId !== 'string') {
    throw new Error('Invalid listing ID provided');
  }

  if (!listing) {
    throw new Error('Listing data is required');
  }

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
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('images, videos')
      .eq('id', listingId)
      .single();

    if (fetchError) {
      console.error('Error fetching existing listing:', fetchError);
      return { data: null, error: fetchError };
    }

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

    if (error) {
      console.error('Error updating listing:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error updating listing:', error);
    return { data: null, error };
  }
};

// Get a single listing by ID
export const getListingById = async (listingId: string) => {
  if (!listingId || typeof listingId !== 'string') {
    console.error('Invalid listing ID provided');
    return { data: null, error: new Error('Invalid listing ID') };
  }

  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (error) {
      console.error('Error fetching listing by ID:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching listing by ID:', error);
    return { data: null, error };
  }
}; 