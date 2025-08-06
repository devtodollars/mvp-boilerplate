-- Drop existing tables if they exist
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;

-- Create chat_rooms table
CREATE TABLE chat_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(application_id)
);

-- Create messages table
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_chat_rooms_application_id ON chat_rooms(application_id);
CREATE INDEX idx_chat_rooms_owner_id ON chat_rooms(owner_id);
CREATE INDEX idx_chat_rooms_applicant_id ON chat_rooms(applicant_id);
CREATE INDEX idx_messages_chat_room_id ON messages(chat_room_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Chat rooms policies
CREATE POLICY "Users can view their chat rooms" ON chat_rooms
    FOR SELECT USING (
        auth.uid() = owner_id OR auth.uid() = applicant_id
    );

CREATE POLICY "Users can insert their chat rooms" ON chat_rooms
    FOR INSERT WITH CHECK (
        auth.uid() = owner_id OR auth.uid() = applicant_id
    );

-- Messages policies
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
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM chat_rooms 
            WHERE chat_rooms.id = messages.chat_room_id 
            AND (chat_rooms.owner_id = auth.uid() OR chat_rooms.applicant_id = auth.uid())
        )
    );

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON chat_rooms TO authenticated;
GRANT ALL ON messages TO authenticated; 