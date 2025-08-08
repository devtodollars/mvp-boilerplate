-- Add navigation_target column to notifications table
ALTER TABLE notifications 
ADD COLUMN navigation_target TEXT;

-- Update the notifications table to include navigation targets
-- This will help specify exactly where to navigate when a notification is clicked

-- Create an enum for navigation targets (optional, but good for type safety)
CREATE TYPE navigation_target_type AS ENUM (
  'application_detail',
  'chat_room', 
  'applications_list',
  'dashboard',
  'profile'
);

-- Add a comment to explain the navigation_target field
COMMENT ON COLUMN notifications.navigation_target IS 'Specifies where to navigate when notification is clicked. Format: "type:id" or "route"';

-- Update existing notifications to have navigation targets based on their type
UPDATE notifications 
SET navigation_target = 
  CASE 
    WHEN type = 'application' THEN 'application_detail:' || (data->>'application_id')
    WHEN type = 'message' THEN 'chat_room:' || (data->>'application_id')
    WHEN type = 'application_status' THEN 'application_detail:' || (data->>'application_id')
    ELSE 'dashboard'
  END
WHERE navigation_target IS NULL;
