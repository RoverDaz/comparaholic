/*
  # Fix is_admin Function

  1. Changes
    - Drop existing is_admin function if it exists
    - Create new is_admin function with logging
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS is_admin();

-- Create new is_admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_user boolean;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Log the check
  RAISE LOG 'Checking admin status for user: %', current_user_id;
  
  -- Check if user is in admin_users table
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = current_user_id
  ) INTO is_admin_user;
  
  -- Log the result
  RAISE LOG 'Admin check result for user %: %', current_user_id, is_admin_user;
  
  RETURN COALESCE(is_admin_user, false);
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE LOG 'Error in is_admin function for user %: %', current_user_id, SQLERRM;
    RETURN false;
END;
$$; 