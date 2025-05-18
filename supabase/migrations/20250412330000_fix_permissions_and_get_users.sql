/*
  # Fix Permissions and get_users Function

  1. Changes
    - Grant necessary permissions for auth schema
    - Fix get_users function to properly handle permissions
*/

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.identities TO authenticated;
GRANT SELECT ON auth.sessions TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_users();

-- Create new get_users function with proper permissions
CREATE OR REPLACE FUNCTION get_users()
RETURNS TABLE (
    id uuid,
    email text,
    user_metadata jsonb,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Log the check
    RAISE LOG 'get_users: Checking admin status for user: %', current_user_id;
    
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 
        FROM public.admin_users 
        WHERE user_id = current_user_id
    ) THEN
        RAISE LOG 'get_users: User % is not admin', current_user_id;
        RAISE EXCEPTION 'Not authorized';
    END IF;

    RAISE LOG 'get_users: User % is admin, fetching all users', current_user_id;
    
    -- Return all user data
    RETURN QUERY
    SELECT 
        u.id::uuid,
        u.email::text,
        COALESCE(u.raw_user_meta_data, '{}'::jsonb) as user_metadata,
        u.created_at::timestamptz
    FROM auth.users u
    ORDER BY u.created_at DESC;
    
    RAISE LOG 'get_users: Successfully fetched all users for admin %', current_user_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        RAISE LOG 'get_users: Error for user %: %', current_user_id, SQLERRM;
        RAISE;
END;
$$; 