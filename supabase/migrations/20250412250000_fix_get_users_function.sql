/*
  # Fix get_users Function

  1. Changes
    - Drop existing get_users function if it exists
    - Create new get_users function with proper text types
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_users();

-- Create new get_users function
CREATE OR REPLACE FUNCTION get_users()
RETURNS TABLE (
    id uuid,
    email text,
    user_metadata jsonb,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 
        FROM public.admin_users 
        WHERE user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- Return user data
    RETURN QUERY
    SELECT 
        u.id::uuid,
        u.email::text,
        u.raw_user_meta_data::jsonb,
        u.created_at::timestamptz
    FROM auth.users u
    ORDER BY u.created_at DESC;
END;
$$; 