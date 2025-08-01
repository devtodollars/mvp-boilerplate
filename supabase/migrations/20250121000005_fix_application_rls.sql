-- Re-enable RLS and fix the policies properly
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can insert applications" ON applications;

-- Create a new policy that allows users to insert applications for any listing
CREATE POLICY "Users can insert applications for any listing" ON applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure the function can bypass RLS
ALTER FUNCTION add_application_to_queue(UUID, UUID, TEXT) SECURITY DEFINER; 