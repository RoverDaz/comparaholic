/*
  # Grant RPC Permissions

  1. Changes
    - Grant execute permission on get_users function to authenticated users
    - Grant execute permission on is_admin function to authenticated users
*/

-- Grant execute permission on get_users function
GRANT EXECUTE ON FUNCTION get_users() TO authenticated;

-- Grant execute permission on is_admin function
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Grant select permission on admin_users table
GRANT SELECT ON public.admin_users TO authenticated; 