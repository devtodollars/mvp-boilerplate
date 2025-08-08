-- Update the application notification function to include navigation_target
CREATE OR REPLACE FUNCTION create_application_notification()
RETURNS TRIGGER AS $$
DECLARE
  listing_data RECORD;
  applicant_data RECORD;
  owner_id UUID;
BEGIN
  -- Get listing information
  SELECT user_id INTO owner_id
  FROM listings
  WHERE id = NEW.listing_id;
  
  -- Get applicant information
  SELECT 
    COALESCE(full_name, CONCAT(first_name, ' ', last_name)) as name
  INTO applicant_data
  FROM users
  WHERE id = NEW.user_id;
  
  -- Get listing information
  SELECT property_name
  INTO listing_data
  FROM listings
  WHERE id = NEW.listing_id;
  
  -- Create notification for the listing owner
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    navigation_target
  ) VALUES (
    owner_id,
    'application',
    'New application for ' || listing_data.property_name,
    applicant_data.name || ' applied to your property',
    jsonb_build_object(
      'application_id', NEW.id,
      'listing_id', NEW.listing_id,
      'listing_name', listing_data.property_name,
      'applicant_name', applicant_data.name
    ),
    'application_detail:' || NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the message notification function to include navigation_target
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  chat_room_data RECORD;
  sender_data RECORD;
  recipient_id UUID;
  listing_name TEXT;
BEGIN
  -- Get chat room information
  SELECT 
    owner_id,
    applicant_id,
    application_id
  INTO chat_room_data
  FROM chat_rooms
  WHERE id = NEW.chat_room_id;
  
  -- Determine recipient (the other person in the chat)
  IF NEW.sender_id = chat_room_data.owner_id THEN
    recipient_id := chat_room_data.applicant_id;
  ELSE
    recipient_id := chat_room_data.owner_id;
  END IF;
  
  -- Get sender information
  SELECT 
    COALESCE(full_name, CONCAT(first_name, ' ', last_name)) as name
  INTO sender_data
  FROM users
  WHERE id = NEW.sender_id;
  
  -- Get listing name from application
  SELECT l.property_name
  INTO listing_name
  FROM applications a
  JOIN listings l ON a.listing_id = l.id
  WHERE a.id = chat_room_data.application_id;
  
  -- Create notification for the message recipient
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    navigation_target
  ) VALUES (
    recipient_id,
    'message',
    'New message from ' || sender_data.name,
    CASE 
      WHEN length(NEW.content) > 50 THEN substring(NEW.content from 1 for 50) || '...'
      ELSE NEW.content
    END,
    jsonb_build_object(
      'message_id', NEW.id,
      'chat_room_id', NEW.chat_room_id,
      'application_id', chat_room_data.application_id,
      'listing_name', listing_name,
      'sender_name', sender_data.name
    ),
    'chat_room:' || chat_room_data.application_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the application status notification function to include navigation_target
CREATE OR REPLACE FUNCTION create_application_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  listing_data RECORD;
BEGIN
  -- Only create notification if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get listing information
    SELECT property_name
    INTO listing_data
    FROM listings
    WHERE id = NEW.listing_id;
    
    -- Create notification for the applicant
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      navigation_target
    ) VALUES (
      NEW.user_id,
      'application_status',
      'Application ' || NEW.status || ' for ' || listing_data.property_name,
      'Your application was ' || NEW.status,
      jsonb_build_object(
        'application_id', NEW.id,
        'listing_name', listing_data.property_name,
        'status', NEW.status
      ),
      'application_detail:' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
