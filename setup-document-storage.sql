-- Run this in your Supabase SQL editor to set up document storage

-- Create storage bucket for user documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
-- Users can upload their own documents
CREATE POLICY "Users can upload their own documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'user-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view their own documents
CREATE POLICY "Users can view their own documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'user-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can update their own documents
CREATE POLICY "Users can update their own documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'user-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own documents
CREATE POLICY "Users can delete their own documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'user-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );