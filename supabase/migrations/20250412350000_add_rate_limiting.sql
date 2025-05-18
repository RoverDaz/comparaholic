/*
  # Add Rate Limiting

  1. Changes
    - Create rate_limits table
    - Add rate limiting to update_user_metadata function
    - Add cleanup function for old rate limit entries
*/

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    function_name text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT rate_limits_function_user_key UNIQUE (function_name, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS rate_limits_function_user_created_idx 
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

-- Drop existing function
DROP FUNCTION IF EXISTS update_user_metadata(uuid, jsonb);

-- Create updated function with rate limiting
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

    -- Check rate limit
    SELECT COUNT(*)
    INTO rate_limit_count
    FROM public.rate_limits
    WHERE function_name = 'update_user_metadata'
    AND user_id = current_user_id
    AND created_at > now() - rate_limit_window;

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

    -- Cleanup old rate limit entries
    PERFORM cleanup_rate_limits();
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        RAISE LOG 'update_user_metadata: Error updating user %: %', target_user_id, SQLERRM;
        RAISE;
END;
$$; 