/*
  # Add update_user_metadata Function

  1. Changes
    - Create a function to update user metadata
    - Add proper security checks
    - Add logging for debugging
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_user_metadata(uuid, jsonb);

-- Create function to update user metadata
CREATE OR REPLACE FUNCTION update_user_metadata(
    target_user_id uuid,
    new_metadata jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Log the attempt
    RAISE LOG 'update_user_metadata: Attempting to update user % by admin %', target_user_id, current_user_id;
    
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 
        FROM public.admin_users 
        WHERE user_id = current_user_id
    ) THEN
        RAISE LOG 'update_user_metadata: User % is not admin', current_user_id;
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- Update the user's metadata
    UPDATE auth.users
    SET raw_user_meta_data = new_metadata
    WHERE id = target_user_id;
    
    -- Log success
    RAISE LOG 'update_user_metadata: Successfully updated metadata for user %', target_user_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        RAISE LOG 'update_user_metadata: Error updating user %: %', target_user_id, SQLERRM;
        RAISE;
END;
$$; 