// Utility to get a public URL for a file in Supabase Storage
export function getSupabaseImageUrl(
  path: string,
  bucket: string = 'listing-images'
): string {
  if (!path || typeof path !== 'string') {
    console.warn('Invalid path provided to getSupabaseImageUrl:', path);
    return '/placeholder.svg';
  }

  if (!bucket || typeof bucket !== 'string') {
    console.warn('Invalid bucket provided to getSupabaseImageUrl:', bucket);
    bucket = 'listing-images';
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL not found, returning placeholder');
    return '/placeholder.svg';
  }

  try {
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  } catch (error) {
    console.error('Error constructing Supabase image URL:', error);
    return '/placeholder.svg';
  }
}

// Helper to get listing images with fallback to default
export function getListingImages(images: string[] | null | undefined): string[] {
  if (!images) {
    return [getSupabaseImageUrl('bedroom.PNG')];
  }

  if (!Array.isArray(images)) {
    console.warn('Invalid images parameter provided to getListingImages:', images);
    return [getSupabaseImageUrl('bedroom.PNG')];
  }

  if (images.length === 0) {
    return [getSupabaseImageUrl('bedroom.PNG')];
  }

  try {
    return images.map(img => {
      if (!img || typeof img !== 'string') {
        console.warn('Invalid image URL in array:', img);
        return getSupabaseImageUrl('bedroom.PNG');
      }
      return img.startsWith('http') ? img : getSupabaseImageUrl(img);
    });
  } catch (error) {
    console.error('Error processing listing images:', error);
    return [getSupabaseImageUrl('bedroom.PNG')];
  }
}

// Extract file path from Supabase storage URL
export function extractFilePathFromUrl(url: string): { bucket: string; path: string } | null {
  if (!url || typeof url !== 'string') {
    console.warn('Invalid URL provided to extractFilePathFromUrl:', url);
    return null;
  }

  try {
    const urlParts = url.split('/storage/v1/object/public/');
    if (urlParts.length <= 1) {
      console.warn('Invalid Supabase storage URL format:', url);
      return null;
    }

    const bucketAndPath = urlParts[1];
    if (!bucketAndPath) {
      console.warn('No bucket and path found in URL:', url);
      return null;
    }

    const [bucket, ...pathParts] = bucketAndPath.split('/');
    if (!bucket || pathParts.length === 0) {
      console.warn('Invalid bucket or path in URL:', url);
      return null;
    }

    const filePath = pathParts.join('/');
    return { bucket, path: filePath };
  } catch (error) {
    console.error('Error extracting file path from URL:', error);
    return null;
  }
}

// Delete files from storage bucket
export async function deleteStorageFiles(filePaths: string[], bucket: string = 'listing-images') {
  if (!filePaths || !Array.isArray(filePaths)) {
    console.warn('Invalid filePaths provided to deleteStorageFiles:', filePaths);
    return { success: false, error: new Error('Invalid file paths provided') };
  }

  if (filePaths.length === 0) {
    console.warn('Empty filePaths array provided to deleteStorageFiles');
    return { success: true, error: null };
  }

  if (!bucket || typeof bucket !== 'string') {
    console.warn('Invalid bucket provided to deleteStorageFiles:', bucket);
    bucket = 'listing-images';
  }

  try {
    const { createClient } = await import('./client');
    const supabase = createClient();

    if (!supabase) {
      console.error('Failed to create Supabase client');
      return { success: false, error: new Error('Failed to create Supabase client') };
    }

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
  try {
    const { createClient } = await import('./client');
    const supabase = createClient();

    if (!supabase) {
      console.error('Failed to create Supabase client for cleanup');
      throw new Error('Failed to create Supabase client');
    }

    // Get all files in listing-images bucket
    const { data: imageFiles, error: imageError } = await supabase.storage
      .from('listing-images')
      .list('', { limit: 1000 });
    
    if (imageError) {
      console.error('Error listing image files:', imageError);
      throw imageError;
    }
    
    // Get all files in listing-videos bucket
    const { data: videoFiles, error: videoError } = await supabase.storage
      .from('listing-videos')
      .list('', { limit: 1000 });
    
    if (videoError) {
      console.error('Error listing video files:', videoError);
      throw videoError;
    }
    
    // Get all image and video URLs from database
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('images, videos');
    
    if (listingsError) {
      console.error('Error fetching listings:', listingsError);
      throw listingsError;
    }
    
    // Collect all referenced file paths
    const referencedImagePaths = new Set<string>();
    const referencedVideoPaths = new Set<string>();
    
    if (listings && Array.isArray(listings)) {
      listings.forEach(listing => {
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
    }
    
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