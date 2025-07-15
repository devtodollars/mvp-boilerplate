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