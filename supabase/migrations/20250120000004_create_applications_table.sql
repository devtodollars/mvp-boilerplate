-- Create applications table for queue-based property applications
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  position INTEGER NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique application per user per listing
  UNIQUE(listing_id, user_id),
  
  -- Ensure position is unique per listing
  UNIQUE(listing_id, position)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_applications_listing_id ON applications(listing_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_position ON applications(position);

-- Create function to get next position for a listing
CREATE OR REPLACE FUNCTION get_next_application_position(listing_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_position INTEGER;
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1
  INTO next_position
  FROM applications
  WHERE listing_id = listing_uuid;
  
  RETURN next_position;
END;
$$;

-- Create function to add application to queue
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
  -- Get next position
  next_position := get_next_application_position(listing_uuid);
  
  -- Insert application
  INSERT INTO applications (listing_id, user_id, position, notes)
  VALUES (listing_uuid, user_uuid, next_position, application_notes)
  RETURNING id INTO application_id;
  
  RETURN application_id;
END;
$$;

-- Create function to update application status
CREATE OR REPLACE FUNCTION update_application_status(
  application_uuid UUID,
  new_status TEXT,
  review_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE applications
  SET 
    status = new_status,
    reviewed_at = CASE WHEN new_status IN ('accepted', 'rejected') THEN NOW() ELSE reviewed_at END,
    notes = CASE WHEN review_notes IS NOT NULL THEN review_notes ELSE notes END,
    updated_at = NOW()
  WHERE id = application_uuid;
  
  RETURN FOUND;
END;
$$;

-- Create function to reorder queue after application removal
CREATE OR REPLACE FUNCTION reorder_application_queue(listing_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update positions to be sequential
  UPDATE applications
  SET position = new_position
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY position) as new_position
    FROM applications
    WHERE listing_id = listing_uuid AND status = 'pending'
  ) AS reordered
  WHERE applications.id = reordered.id;
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON applications TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_application_position(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_application_to_queue(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_application_status(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_application_queue(UUID) TO authenticated;

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON applications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view applications for listings they own
CREATE POLICY "Owners can view applications for their listings" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = applications.listing_id 
      AND listings.user_id = auth.uid()
    )
  );

-- Users can insert their own applications
CREATE POLICY "Users can insert own applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own applications (withdraw)
CREATE POLICY "Users can update own applications" ON applications
  FOR UPDATE USING (auth.uid() = user_id);

-- Listing owners can update applications for their listings
CREATE POLICY "Owners can update applications for their listings" ON applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = applications.listing_id 
      AND listings.user_id = auth.uid()
    )
  );

-- Users can delete their own applications
CREATE POLICY "Users can delete own applications" ON applications
  FOR DELETE USING (auth.uid() = user_id); 