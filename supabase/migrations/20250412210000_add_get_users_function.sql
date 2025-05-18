/*
  # Add Get Users Function

  1. Changes
    - Create secure function to fetch users
    - Only accessible by admins
    - Returns only necessary user data
*/

-- Create function to get users (only accessible by admins)
CREATE OR REPLACE FUNCTION get_users()
RETURNS TABLE (
  id uuid,
  email text,
  user_metadata jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user is an admin
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
    au.id,
    au.email,
    au.raw_user_meta_data as user_metadata,
    au.created_at
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$; 