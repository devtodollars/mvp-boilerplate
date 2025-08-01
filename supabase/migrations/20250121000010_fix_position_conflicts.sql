-- Fix position conflicts in add_application_to_queue function
CREATE OR REPLACE FUNCTION add_application_to_queue(
  listing_uuid UUID,
  user_uuid UUID,
  application_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    -- Get next position by finding the highest position and adding 1
    SELECT COALESCE(MAX(position), 0) + 1
    INTO next_position
    FROM applications
    WHERE listing_id = listing_uuid;
    
    -- Insert application with explicit error handling
    BEGIN
      INSERT INTO applications (listing_id, user_id, position, notes, status)
      VALUES (listing_uuid, user_uuid, next_position, application_notes, 'pending')
      RETURNING id INTO application_id;
      
      -- If we get here, the insert was successful
      RETURN application_id;
    EXCEPTION
      WHEN unique_violation THEN
        -- If position conflict, try with a higher position
        SELECT COALESCE(MAX(position), 0) + 1
        INTO next_position
        FROM applications
        WHERE listing_id = listing_uuid;
        
        INSERT INTO applications (listing_id, user_id, position, notes, status)
        VALUES (listing_uuid, user_uuid, next_position, application_notes, 'pending')
        RETURNING id INTO application_id;
        
        RETURN application_id;
    END;
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_application_to_queue(UUID, UUID, TEXT) TO authenticated; 