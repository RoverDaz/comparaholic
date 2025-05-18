/*
  # Add Admin Flag

  1. Changes
    - Create admin_users table in public schema
    - Add admin user for danny@montrealracing.com
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own admin status
CREATE POLICY "Users can read their own admin status"
  ON public.admin_users
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow service role to manage admin users
CREATE POLICY "Service role can manage admin users"
  ON public.admin_users
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Insert admin user (you'll need to get the user_id from auth.users)
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'danny@montrealracing.com';

  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.admin_users (user_id, email)
    VALUES (admin_user_id, 'danny@montrealracing.com')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$; 