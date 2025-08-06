-- Add debug logging to the add_application_to_queue function
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
  -- Debug log
  RAISE NOTICE 'Function called with listing_uuid: %, user_uuid: %, notes: %', listing_uuid, user_uuid, application_notes;
  
  -- Check if user already has an application for this listing
  SELECT id INTO existing_application_id
  FROM applications
  WHERE listing_id = listing_uuid AND user_id = user_uuid;
  
  RAISE NOTICE 'Existing application found: %', existing_application_id;
  
  IF existing_application_id IS NOT NULL THEN
    -- User already has an application, update it instead
    RAISE NOTICE 'Updating existing application: %', existing_application_id;
    
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
    RAISE NOTICE 'Creating new application';
    
    -- Get next position by finding the highest position and adding 1
    SELECT COALESCE(MAX(position), 0) + 1
    INTO next_position
    FROM applications
    WHERE listing_id = listing_uuid;
    
    RAISE NOTICE 'Next position: %', next_position;
    
    -- Insert application with explicit error handling
    BEGIN
      INSERT INTO applications (listing_id, user_id, position, notes, status)
      VALUES (listing_uuid, user_uuid, next_position, application_notes, 'pending')
      RETURNING id INTO application_id;
      
      RAISE NOTICE 'Application created with ID: %', application_id;
      
      -- If we get here, the insert was successful
      RETURN application_id;
    EXCEPTION
      WHEN unique_violation THEN
        RAISE NOTICE 'Unique violation caught, retrying with higher position';
        
        -- If position conflict, try with a higher position
        SELECT COALESCE(MAX(position), 0) + 1
        INTO next_position
        FROM applications
        WHERE listing_id = listing_uuid;
        
        INSERT INTO applications (listing_id, user_id, position, notes, status)
        VALUES (listing_uuid, user_uuid, next_position, application_notes, 'pending')
        RETURNING id INTO application_id;
        
        RAISE NOTICE 'Application created on retry with ID: %', application_id;
        
        RETURN application_id;
      WHEN OTHERS THEN
        RAISE NOTICE 'Unexpected error: %', SQLERRM;
        RAISE;
    END;
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_application_to_queue(UUID, UUID, TEXT) TO authenticated; 