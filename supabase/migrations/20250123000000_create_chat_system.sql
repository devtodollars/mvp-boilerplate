-- Create chat_rooms table
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique chat room per application
  UNIQUE(application_id)
);

-- Create messages table with proper foreign key to users
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system')),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_chat_rooms_listing_id ON chat_rooms(listing_id);
CREATE INDEX idx_chat_rooms_owner_id ON chat_rooms(owner_id);
CREATE INDEX idx_chat_rooms_applicant_id ON chat_rooms(applicant_id);
CREATE INDEX idx_chat_rooms_application_id ON chat_rooms(application_id);
CREATE INDEX idx_messages_chat_room_id ON messages(chat_room_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_rooms
CREATE POLICY "Users can view chat rooms they participate in" ON chat_rooms
  FOR SELECT USING (
    auth.uid() = owner_id OR auth.uid() = applicant_id
  );

CREATE POLICY "Users can insert chat rooms for their applications" ON chat_rooms
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id OR auth.uid() = applicant_id
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their chat rooms" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE chat_rooms.id = messages.chat_room_id 
      AND (chat_rooms.owner_id = auth.uid() OR chat_rooms.applicant_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their chat rooms" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE chat_rooms.id = messages.chat_room_id 
      AND (chat_rooms.owner_id = auth.uid() OR chat_rooms.applicant_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON chat_rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(chat_room_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE messages
  SET read_at = NOW()
  WHERE chat_room_id = chat_room_uuid 
    AND sender_id != auth.uid()
    AND read_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID) TO authenticated; 