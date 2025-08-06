-- Create a function to clean up storage files when listings are deleted
CREATE OR REPLACE FUNCTION cleanup_listing_storage()
RETURNS TRIGGER AS $$
DECLARE
  image_paths TEXT[] := '{}';
  video_paths TEXT[] := '{}';
  image_url TEXT;
  video_url TEXT;
  url_parts TEXT[];
  bucket_and_path TEXT;
  bucket TEXT;
  file_path TEXT;
  path_parts TEXT[];
BEGIN
  -- Extract image paths from the deleted listing
  IF OLD.images IS NOT NULL AND jsonb_typeof(OLD.images) = 'array' THEN
    FOR image_url IN SELECT jsonb_array_elements_text(OLD.images)
    LOOP
      -- Extract file path from Supabase URL
      url_parts := string_to_array(image_url, '/storage/v1/object/public/');
      IF array_length(url_parts, 1) > 1 THEN
        bucket_and_path := url_parts[2];
        path_parts := string_to_array(bucket_and_path, '/');
        bucket := path_parts[1];
        file_path := array_to_string(path_parts[2:], '/');
        
        IF bucket = 'listing-images' THEN
          image_paths := array_append(image_paths, file_path);
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Extract video paths from the deleted listing
  IF OLD.videos IS NOT NULL AND jsonb_typeof(OLD.videos) = 'array' THEN
    FOR video_url IN SELECT jsonb_array_elements_text(OLD.videos)
    LOOP
      -- Extract file path from Supabase URL
      url_parts := string_to_array(video_url, '/storage/v1/object/public/');
      IF array_length(url_parts, 1) > 1 THEN
        bucket_and_path := url_parts[2];
        path_parts := string_to_array(bucket_and_path, '/');
        bucket := path_parts[1];
        file_path := array_to_string(path_parts[2:], '/');
        
        IF bucket = 'listing-videos' THEN
          video_paths := array_append(video_paths, file_path);
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Note: We can't directly delete from storage in a trigger function
  -- because it requires external API calls. The main cleanup happens
  -- in the delete-account API route. This trigger serves as a backup
  -- and logs what should be cleaned up.
  
  -- Log the files that should be cleaned up
  IF array_length(image_paths, 1) > 0 OR array_length(video_paths, 1) > 0 THEN
    RAISE NOTICE 'Listing % deleted. Storage cleanup needed for: Images: %, Videos: %', 
      OLD.id, image_paths, video_paths;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS cleanup_storage_on_listing_delete ON listings;
CREATE TRIGGER cleanup_storage_on_listing_delete
  AFTER DELETE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_listing_storage();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_listing_storage() TO authenticated; 