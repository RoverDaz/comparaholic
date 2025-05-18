/*
  # Ensure Admin User

  1. Changes
    - Ensure admin_users table exists
    - Insert admin user if not exists
*/

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS admin_users_user_id_idx ON public.admin_users(user_id);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can check if they are admin" ON public.admin_users;

-- Create policy to allow users to check if they are admin
CREATE POLICY "Users can check if they are admin"
    ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (true);

-- Insert admin user if not exists
INSERT INTO public.admin_users (user_id)
SELECT '0c3de83d-7d7e-40b2-af86-054e8892b6e4'
WHERE NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = '0c3de83d-7d7e-40b2-af86-054e8892b6e4'
); 