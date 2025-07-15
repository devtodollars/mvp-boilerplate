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

// Fetch all active listings
export async function fetchListings() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });
    console.log(data)
  return { data, error };
} 