/*
  # Fix Data Visibility Issues

  1. Changes
    - Drop all existing policies for user_form_responses
    - Create new policies that ensure:
      - Anyone can read all responses
      - Authenticated users can only manage their own responses
    - Add performance indexes

  2. Security
    - Maintain write protection for user's own data
    - Enable public read access to all responses
*/

-- Safely drop all existing policies
DO $$ 
BEGIN
  -- Drop all policies on the table
  DROP POLICY IF EXISTS "Anyone can read responses" ON user_form_responses;
  DROP POLICY IF EXISTS "Users can manage their own responses" ON user_form_responses;
  DROP POLICY IF EXISTS "Anyone can read all responses" ON user_form_responses;
  DROP POLICY IF EXISTS "Public read for real estate broker responses" ON user_form_responses;
END $$;

-- Create new policies with proper permissions
CREATE POLICY "Public can read all responses"
  ON user_form_responses
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage own responses"
  ON user_form_responses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure indexes exist for performance
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'user_form_responses' 
    AND indexname = 'idx_user_form_responses_category'
  ) THEN
    CREATE INDEX idx_user_form_responses_category 
    ON user_form_responses (category);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'user_form_responses' 
    AND indexname = 'idx_user_form_responses_created_at'
  ) THEN
    CREATE INDEX idx_user_form_responses_created_at 
    ON user_form_responses (created_at DESC);
  END IF;
END $$;