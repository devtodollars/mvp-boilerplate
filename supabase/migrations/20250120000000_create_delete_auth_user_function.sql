-- Create a function to delete auth users with admin privileges
-- This function can only be called by authenticated users and will delete their own auth account
CREATE OR REPLACE FUNCTION delete_auth_user(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the user from auth.users table
  DELETE FROM auth.users WHERE id = user_id;
  
  -- If no rows were affected, raise an error
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found in auth.users table';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_auth_user(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION delete_auth_user(UUID) IS 'Deletes a user from auth.users table. Can only be called by the user themselves.'; 