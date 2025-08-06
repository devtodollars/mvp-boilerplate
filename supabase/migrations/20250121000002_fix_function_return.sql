-- Fix the add_application_to_queue function to properly return the application ID
CREATE OR REPLACE FUNCTION add_application_to_queue(
  listing_uuid UUID,
  user_uuid UUID,
  application_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  application_id UUID;
  next_position INTEGER;
  existing_application_id UUID;
BEGIN
  -- Check if user already has an application for this listing
  SELECT id INTO existing_application_id
  FROM applications
  WHERE listing_id = listing_uuid AND user_id = user_uuid;
  
  IF existing_application_id IS NOT NULL THEN
    -- User already has an application, update it instead
    UPDATE applications
    SET 
      status = 'pending',
      notes = application_notes,
      applied_at = NOW(),
      updated_at = NOW()
    WHERE id = existing_application_id;
    
    RETURN existing_application_id;
  ELSE
    -- User doesn't have an application, create a new one
    -- Get next position
    SELECT get_next_application_position(listing_uuid) INTO next_position;
    
    -- Insert application and capture the returned ID
    INSERT INTO applications (listing_id, user_id, position, notes)
    VALUES (listing_uuid, user_uuid, next_position, application_notes)
    RETURNING id INTO application_id;
    
    -- Ensure we return the application ID
    IF application_id IS NULL THEN
      RAISE EXCEPTION 'Failed to create application - no ID returned';
    END IF;
    
    RETURN application_id;
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_application_to_queue(UUID, UUID, TEXT) TO authenticated; 