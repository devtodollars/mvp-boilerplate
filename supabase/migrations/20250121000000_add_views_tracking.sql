-- Add views tracking to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE;

-- Create function to increment views for a listing
CREATE OR REPLACE FUNCTION increment_listing_views(listing_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_views_count INTEGER;
BEGIN
  UPDATE listings 
  SET 
    views_count = COALESCE(views_count, 0) + 1,
    last_viewed_at = NOW()
  WHERE id = listing_uuid
  RETURNING views_count INTO new_views_count;
  
  RETURN COALESCE(new_views_count, 0);
END;
$$;

-- Create function to get applicant count for a listing
CREATE OR REPLACE FUNCTION get_listing_applicant_count(listing_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  applicant_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO applicant_count
  FROM applications
  WHERE listing_id = listing_uuid AND status != 'withdrawn';
  
  RETURN COALESCE(applicant_count, 0);
END;
$$;

-- Create function to get listing stats (applicants and views)
CREATE OR REPLACE FUNCTION get_listing_stats(listing_uuid UUID)
RETURNS TABLE(
  applicant_count INTEGER,
  views_count INTEGER,
  last_viewed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    get_listing_applicant_count(listing_uuid) as applicant_count,
    COALESCE(l.views_count, 0) as views_count,
    l.last_viewed_at
  FROM listings l
  WHERE l.id = listing_uuid;
END;
$$;

-- Create trigger to update applicant count in listings table
CREATE OR REPLACE FUNCTION update_listing_applicant_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the applicants JSONB field with the current count
  UPDATE listings 
  SET applicants = jsonb_build_object(
    'count', get_listing_applicant_count(NEW.listing_id),
    'last_updated', NOW()
  )
  WHERE id = NEW.listing_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for applications table
DROP TRIGGER IF EXISTS trigger_update_applicant_count ON applications;
CREATE TRIGGER trigger_update_applicant_count
  AFTER INSERT OR UPDATE OR DELETE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_applicant_count();

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_listing_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_listing_applicant_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_listing_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_listing_applicant_count() TO authenticated; 