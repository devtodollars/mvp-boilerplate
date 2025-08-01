-- Fix RLS policies to allow application creation
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can insert own applications" ON applications;

-- Create a new policy that allows users to insert applications for any listing
CREATE POLICY "Users can insert applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Also ensure the function can bypass RLS
ALTER FUNCTION add_application_to_queue(UUID, UUID, TEXT) SECURITY DEFINER; 