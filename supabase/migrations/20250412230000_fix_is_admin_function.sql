/*
  # Fix is_admin Function

  1. Changes
    - Drop existing is_admin function if it exists
    - Create new is_admin function with proper error handling
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS is_admin();

-- Create new is_admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  -- Check if user is in admin_users table
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid()
  ) INTO is_admin_user;
  
  RETURN COALESCE(is_admin_user, false);
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error (you can check these in the Supabase logs)
    RAISE LOG 'Error in is_admin function: %', SQLERRM;
    RETURN false;
END;
$$; 