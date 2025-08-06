// Utility to get a public URL for a file in Supabase Storage
export function getSupabaseImageUrl(
  path: string,
  bucket: string = 'listing-images'
): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return '/placeholder.svg';
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

// Helper to get listing images with fallback to default
export function getListingImages(images: string[] | null | undefined): string[] {
  if (Array.isArray(images) && images.length > 0) {
    return images.map(img =>
      img.startsWith('http') ? img : getSupabaseImageUrl(img)
    );
  }
  // fallback to default image in bucket
  return [getSupabaseImageUrl('bedroom.PNG')];
}

// Extract file path from Supabase storage URL
export function extractFilePathFromUrl(url: string): { bucket: string; path: string } | null {
  try {
    const urlParts = url.split('/storage/v1/object/public/');
    if (urlParts.length > 1) {
      const bucketAndPath = urlParts[1];
      const [bucket, ...pathParts] = bucketAndPath.split('/');
      const filePath = pathParts.join('/');
      return { bucket, path: filePath };
    }
  } catch (error) {
    console.error('Error extracting file path from URL:', error);
  }
  return null;
}

// Delete files from storage bucket
export async function deleteStorageFiles(filePaths: string[], bucket: string = 'listing-images') {
  const { createClient } = await import('./client');
  const supabase = createClient();
  
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(filePaths);
    
    if (error) {
      console.error(`Error deleting files from ${bucket}:`, error);
      return { success: false, error };
    }
    
    console.log(`Successfully deleted ${filePaths.length} files from ${bucket}`);
    return { success: true, error: null };
  } catch (error) {
    console.error(`Exception deleting files from ${bucket}:`, error);
    return { success: false, error };
  }
}

// Clean up orphaned storage files (files in storage but not referenced in database)
export async function cleanupOrphanedStorageFiles() {
  const { createClient } = await import('./client');
  const supabase = createClient();
  
  try {
    // Get all files in listing-images bucket
    const { data: imageFiles, error: imageError } = await supabase.storage
      .from('listing-images')
      .list('', { limit: 1000 });
    
    if (imageError) {
      console.error('Error listing image files:', imageError);
      return;
    }
    
    // Get all files in listing-videos bucket
    const { data: videoFiles, error: videoError } = await supabase.storage
      .from('listing-videos')
      .list('', { limit: 1000 });
    
    if (videoError) {
      console.error('Error listing video files:', videoError);
      return;
    }
    
    // Get all image and video URLs from database
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('images, videos');
    
    if (listingsError) {
      console.error('Error fetching listings:', listingsError);
      return;
    }
    
    // Collect all referenced file paths
    const referencedImagePaths = new Set<string>();
    const referencedVideoPaths = new Set<string>();
    
    listings?.forEach(listing => {
      if (listing.images && Array.isArray(listing.images)) {
        listing.images.forEach((imageUrl: any) => {
          if (typeof imageUrl === 'string') {
            const fileInfo = extractFilePathFromUrl(imageUrl);
            if (fileInfo && fileInfo.bucket === 'listing-images') {
              referencedImagePaths.add(fileInfo.path);
            }
          }
        });
      }
      
      if (listing.videos && Array.isArray(listing.videos)) {
        listing.videos.forEach((videoUrl: any) => {
          if (typeof videoUrl === 'string') {
            const fileInfo = extractFilePathFromUrl(videoUrl);
            if (fileInfo && fileInfo.bucket === 'listing-videos') {
              referencedVideoPaths.add(fileInfo.path);
            }
          }
        });
      }
    });
    
    // Find orphaned files
    const orphanedImagePaths = imageFiles
      ?.filter(file => !referencedImagePaths.has(file.name))
      .map(file => file.name) || [];
    
    const orphanedVideoPaths = videoFiles
      ?.filter(file => !referencedVideoPaths.has(file.name))
      .map(file => file.name) || [];
    
    console.log(`Found ${orphanedImagePaths.length} orphaned images and ${orphanedVideoPaths.length} orphaned videos`);
    
    // Delete orphaned files
    if (orphanedImagePaths.length > 0) {
      await deleteStorageFiles(orphanedImagePaths, 'listing-images');
    }
    
    if (orphanedVideoPaths.length > 0) {
      await deleteStorageFiles(orphanedVideoPaths, 'listing-videos');
    }
    
    return {
      orphanedImages: orphanedImagePaths.length,
      orphanedVideos: orphanedVideoPaths.length
    };
  } catch (error) {
    console.error('Error in cleanupOrphanedStorageFiles:', error);
    throw error;
  }
} 