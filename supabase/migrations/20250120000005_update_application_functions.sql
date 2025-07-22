-- Update the add_application_to_queue function to handle re-applications
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
  existing_application RECORD;
BEGIN
  -- Check if user already has an application for this listing
  SELECT * INTO existing_application
  FROM applications
  WHERE listing_id = listing_uuid AND user_id = user_uuid;
  
  IF existing_application IS NOT NULL THEN
    -- Update existing application
    UPDATE applications
    SET 
      status = 'pending',
      notes = application_notes,
      applied_at = NOW(),
      updated_at = NOW()
    WHERE id = existing_application.id;
    
    RETURN existing_application.id;
  ELSE
    -- Get next position for new application
    next_position := get_next_application_position(listing_uuid);
    
    -- Insert new application
    INSERT INTO applications (listing_id, user_id, position, notes)
    VALUES (listing_uuid, user_uuid, next_position, application_notes)
    RETURNING id INTO application_id;
    
    RETURN application_id;
  END IF;
END;
$$;

-- Create a function to reapply to a property
CREATE OR REPLACE FUNCTION reapply_to_property(
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
  -- Get next position
  next_position := get_next_application_position(listing_uuid);
  
  -- Update existing application or create new one
  UPDATE applications
  SET 
    status = 'pending',
    position = next_position,
    notes = application_notes,
    applied_at = NOW(),
    updated_at = NOW()
  WHERE listing_id = listing_uuid AND user_id = user_uuid
  RETURNING id INTO application_id;
  
  -- If no existing application was updated, create a new one
  IF application_id IS NULL THEN
    INSERT INTO applications (listing_id, user_id, position, notes)
    VALUES (listing_uuid, user_uuid, next_position, application_notes)
    RETURNING id INTO application_id;
  END IF;
  
  RETURN application_id;
END;
$$;

-- Grant permissions for the new function
GRANT EXECUTE ON FUNCTION reapply_to_property(UUID, UUID, TEXT) TO authenticated; 