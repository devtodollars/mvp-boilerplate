-- Fix the unique constraint issue for applications
-- Update the add_application_to_queue function to properly handle re-applications

CREATE OR REPLACE FUNCTION add_application_to_queue(
  listing_uuid UUID,
  user_uuid UUID,
  application_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  application_id UUID;
  next_position INTEGER;
BEGIN
  -- Try to update existing application first
  UPDATE applications
  SET 
    status = 'pending',
    notes = application_notes,
    applied_at = NOW(),
    updated_at = NOW()
  WHERE listing_id = listing_uuid AND user_id = user_uuid
  RETURNING id INTO application_id;
  
  -- If an existing application was updated, return its ID
  IF application_id IS NOT NULL THEN
    RETURN application_id;
  END IF;
  
  -- If no existing application was found, create a new one
  next_position := get_next_application_position(listing_uuid);
  
  INSERT INTO applications (listing_id, user_id, position, notes, status, applied_at)
  VALUES (listing_uuid, user_uuid, next_position, application_notes, 'pending', NOW())
  RETURNING id INTO application_id;
  
  RETURN application_id;
END;
$$;

-- Also add an ON CONFLICT clause to the applications table to handle duplicates gracefully
-- This is a safety measure in case the function fails

ALTER TABLE applications 
ADD CONSTRAINT applications_listing_user_unique 
UNIQUE (listing_id, user_id);

-- Create a trigger to handle conflicts gracefully
CREATE OR REPLACE FUNCTION handle_application_conflict()
RETURNS TRIGGER AS $$
BEGIN
  -- If there's a conflict, update the existing record instead
  UPDATE applications
  SET 
    status = 'pending',
    notes = NEW.notes,
    applied_at = NOW(),
    updated_at = NOW()
  WHERE listing_id = NEW.listing_id AND user_id = NEW.user_id;
  
  -- Return NULL to prevent the insert
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS applications_conflict_trigger ON applications;
CREATE TRIGGER applications_conflict_trigger
  BEFORE INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION handle_application_conflict();

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_application_conflict() TO authenticated; 