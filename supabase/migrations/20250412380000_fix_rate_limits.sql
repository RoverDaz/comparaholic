/*
  # Fix Rate Limits

  1. Changes
    - Remove unique constraint from rate_limits
    - Update rate limiting logic
    - Add better cleanup
*/

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_users();
DROP FUNCTION IF EXISTS update_user_metadata(uuid, jsonb);
DROP FUNCTION IF EXISTS cleanup_rate_limits();

-- Drop and recreate rate_limits table
DROP TABLE IF EXISTS public.rate_limits;

CREATE TABLE public.rate_limits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    function_name text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX rate_limits_function_user_created_idx 
ON public.rate_limits (function_name, user_id, created_at);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to view rate limits
CREATE POLICY "Admins can view rate limits"
ON public.rate_limits
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
    )
);

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete rate limit entries older than 1 hour
    DELETE FROM public.rate_limits
    WHERE created_at < now() - interval '1 hour';
END;
$$;

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

    -- Cleanup old rate limit entries first
    PERFORM cleanup_rate_limits();

    -- Check rate limit
    SELECT COUNT(*)
    INTO rate_limit_count
    FROM public.rate_limits rl
    WHERE rl.function_name = 'get_users'
    AND rl.user_id = current_user_id
    AND rl.created_at > now() - rate_limit_window;

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
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        RAISE LOG 'get_users: Error for user %: %', current_user_id, SQLERRM;
        RAISE;
END;
$$;

-- Create updated update_user_metadata function
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
    rate_limit_count integer;
    rate_limit_window interval := interval '1 minute';
    max_requests integer := 10;
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

    -- Cleanup old rate limit entries first
    PERFORM cleanup_rate_limits();

    -- Check rate limit
    SELECT COUNT(*)
    INTO rate_limit_count
    FROM public.rate_limits rl
    WHERE rl.function_name = 'update_user_metadata'
    AND rl.user_id = current_user_id
    AND rl.created_at > now() - rate_limit_window;

    IF rate_limit_count >= max_requests THEN
        RAISE LOG 'update_user_metadata: Rate limit exceeded for user %', current_user_id;
        RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
    END IF;

    -- Record this request
    INSERT INTO public.rate_limits (function_name, user_id)
    VALUES ('update_user_metadata', current_user_id);

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