-- Fix ambiguous column reference in can_access_shared_document function
-- This fixes the "column reference user_id is ambiguous" error when applying to properties

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
    -- Fix: Use fully qualified column reference to avoid ambiguity
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