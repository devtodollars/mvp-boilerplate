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

// Fetch all listings (both active and inactive for now)
export async function fetchListings() {
  const supabase = createClient();
  
  // Try to fetch with RLS first
  let { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });
  
  console.log('Fetch attempt result:', { 
    dataLength: data?.length || 0, 
    error: error?.message,
    hasData: !!data 
  });
  
  // If no data or error, try a different approach
  if (!data || data.length === 0 || error) {
    console.log('No listings found with RLS, trying alternative approach...');
    
    // Try fetching with different conditions
    const { data: activeData, error: activeError } = await supabase
      .from('listings')
      .select('*')
      .eq('active', true);
    
    const { data: inactiveData, error: inactiveError } = await supabase
      .from('listings')
      .select('*')
      .eq('active', false);
    
    console.log('Alternative fetch results:', {
      activeCount: activeData?.length || 0,
      inactiveCount: inactiveData?.length || 0,
      activeError: activeError?.message,
      inactiveError: inactiveError?.message
    });
    
    // Return all data combined
    const combinedData = [...(activeData || []), ...(inactiveData || [])];
    return { data: combinedData, error: null };
  }
  
  return { data, error };
}

// Fetch only active listings
export async function fetchActiveListings() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });
  return { data, error };
}

// Debug function to check if there are any listings at all
export async function debugListings() {
  const supabase = createClient();
  
  // Try to fetch all listings
  const { data: allListings, error: allError } = await supabase
    .from('listings')
    .select('*');
  
  // Try to fetch active listings
  const { data: activeListings, error: activeError } = await supabase
    .from('listings')
    .select('*')
    .eq('active', true);
  
  // Try to fetch inactive listings
  const { data: inactiveListings, error: inactiveError } = await supabase
    .from('listings')
    .select('*')
    .eq('active', false);
  
  console.log('Debug listings:', {
    allListings: allListings?.length || 0,
    activeListings: activeListings?.length || 0,
    inactiveListings: inactiveListings?.length || 0,
    allError,
    activeError,
    inactiveError
  });
  
  // If no listings exist, log it
  if (!allListings || allListings.length === 0) {
    console.log('No listings found in database. This might be due to RLS policies or no data exists.');
  }
  
  return {
    allListings,
    activeListings,
    inactiveListings,
    errors: { allError, activeError, inactiveError }
  };
} 