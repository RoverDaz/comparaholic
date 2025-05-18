/*
  # Grant Auth Permissions

  1. Changes
    - Grant necessary permissions for accessing auth data
*/

-- Grant usage on auth schema
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Grant select on auth.users
GRANT SELECT ON auth.users TO authenticated;

-- Grant select on auth.identities
GRANT SELECT ON auth.identities TO authenticated;

-- Grant select on auth.sessions
GRANT SELECT ON auth.sessions TO authenticated;

-- Grant select on auth.audit_log_entries
GRANT SELECT ON auth.audit_log_entries TO authenticated;

-- Grant execute on auth functions
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.role() TO authenticated; 