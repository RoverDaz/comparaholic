/*
  # Grant Auth Users Access

  1. Changes
    - Grant access to auth.users view for the get_users function
*/

-- Grant access to auth.users view
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated; 