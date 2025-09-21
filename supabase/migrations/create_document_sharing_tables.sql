-- Create document sharing tables for property applications
-- This enables secure document sharing between tenants and landlords

-- Super simple approach: Just add shared_documents column to existing applications table
-- No new tables needed!

-- Add shared_documents column to applications table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'applications' AND column_name = 'shared_documents'
    ) THEN
        ALTER TABLE applications ADD COLUMN shared_documents JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Create index for better performance on shared_documents column
CREATE INDEX IF NOT EXISTS idx_applications_shared_documents ON applications USING GIN (shared_documents);

-- Create a simple function to check if a user can access a shared document
CREATE OR REPLACE FUNCTION can_access_shared_document(
    document_path TEXT,
    user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    document_owner UUID;
    document_filename TEXT;
BEGIN
    -- Extract user ID and filename from path (format: user_id/filename)
    document_owner := (string_to_array(document_path, '/'))[1]::UUID;
    document_filename := (string_to_array(document_path, '/'))[2];
    
    -- Check if the user is the document owner
    IF document_owner = user_id THEN
        RETURN TRUE;
    END IF;
    
    -- Check if the document is shared in any application where user is the landlord
    RETURN EXISTS (
        SELECT 1 
        FROM applications a
        JOIN listings l ON a.listing_id = l.id
        WHERE l.user_id = can_access_shared_document.user_id
        AND a.shared_documents @> jsonb_build_array(
            jsonb_build_object('filename', document_filename)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update storage policies to allow landlords to access shared documents
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Create new policies that allow shared access
-- Users can upload their own documents
CREATE POLICY "Users can upload their own documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'user-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view their own documents OR documents shared with them via applications
CREATE POLICY "Users can view documents they own or that are shared with them" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'user-documents' AND (
            auth.uid()::text = (storage.foldername(name))[1] OR
            can_access_shared_document(name, auth.uid())
        )
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