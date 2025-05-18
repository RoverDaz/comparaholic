/*
  # Fix Data Visibility and Performance Issues

  1. Changes
    - Drop and recreate all policies for user_form_responses
    - Add targeted indexes for common query patterns
    - Enable public read access while maintaining write protection

  2. Security
    - Maintain write protection for authenticated users
    - Enable unrestricted read access
*/

-- Drop all existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can read responses" ON user_form_responses;
  DROP POLICY IF EXISTS "Users can manage their own responses" ON user_form_responses;
  DROP POLICY IF EXISTS "Anyone can read all responses" ON user_form_responses;
  DROP POLICY IF EXISTS "Public can read all responses" ON user_form_responses;
  DROP POLICY IF EXISTS "Users can manage own responses" ON user_form_responses;
  DROP POLICY IF EXISTS "Public read for real estate broker responses" ON user_form_responses;
END $$;

-- Drop existing indexes to recreate them
DROP INDEX IF EXISTS idx_user_form_responses_category;
DROP INDEX IF EXISTS idx_user_form_responses_created_at;

-- Create optimized indexes
CREATE INDEX idx_user_form_responses_category_created 
ON user_form_responses (category, created_at DESC);

CREATE INDEX idx_user_form_responses_user_category 
ON user_form_responses (user_id, category);

-- Create simplified policies
CREATE POLICY "Enable read access for everyone"
ON user_form_responses
FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON user_form_responses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id"
ON user_form_responses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id"
ON user_form_responses
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);