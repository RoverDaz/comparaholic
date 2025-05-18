/*
  # Fix get_users Function

  1. Changes
    - Update get_users function to work with new setup
    - Add proper search path
    - Add rate limiting
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_users();

-- Create updated get_users function
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
    rate_limit_count integer;
    rate_limit_window interval := interval '1 minute';
    max_requests integer := 10;
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

    -- Check rate limit
    SELECT COUNT(*)
    INTO rate_limit_count
    FROM public.rate_limits
    WHERE function_name = 'get_users'
    AND user_id = current_user_id
    AND created_at > now() - rate_limit_window;

    IF rate_limit_count >= max_requests THEN
        RAISE LOG 'get_users: Rate limit exceeded for user %', current_user_id;
        RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
    END IF;

    -- Record this request
    INSERT INTO public.rate_limits (function_name, user_id)
    VALUES ('get_users', current_user_id);

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

    -- Cleanup old rate limit entries
    PERFORM cleanup_rate_limits();
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        RAISE LOG 'get_users: Error for user %: %', current_user_id, SQLERRM;
        RAISE;
END;
$$; 