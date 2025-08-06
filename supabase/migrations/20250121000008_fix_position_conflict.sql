-- Fix the position conflict issue in the add_application_to_queue function
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
  max_attempts INTEGER := 10;
  attempt_count INTEGER := 0;
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
    -- Try to find an available position
    LOOP
      attempt_count := attempt_count + 1;
      
      -- Get next position
      SELECT get_next_application_position(listing_uuid) INTO next_position;
      
      -- Try to insert with this position
      BEGIN
        INSERT INTO applications (listing_id, user_id, position, notes, status)
        VALUES (listing_uuid, user_uuid, next_position, application_notes, 'pending')
        RETURNING id INTO application_id;
        
        -- If we get here, the INSERT was successful
        EXIT;
        
      EXCEPTION WHEN unique_violation THEN
        -- Position conflict, try again with a higher position
        IF attempt_count >= max_attempts THEN
          RAISE EXCEPTION 'Could not find available position after % attempts', max_attempts;
        END IF;
        
        -- Force a higher position by temporarily inserting a dummy record
        INSERT INTO applications (listing_id, user_id, position, notes, status)
        VALUES (listing_uuid, user_uuid, next_position + 1, 'TEMP', 'pending')
        ON CONFLICT (listing_id, position) DO NOTHING;
        
        -- Delete the temporary record
        DELETE FROM applications 
        WHERE listing_id = listing_uuid AND position = next_position + 1 AND notes = 'TEMP';
        
        CONTINUE;
      END;
    END LOOP;
    
    RETURN application_id;
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_application_to_queue(UUID, UUID, TEXT) TO authenticated; 