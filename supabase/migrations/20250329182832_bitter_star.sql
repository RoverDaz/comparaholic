/*
  # Fix Data Visibility Issues

  1. Changes
    - Safely update RLS policies for user_form_responses table
    - Ensure all submissions are visible to everyone
    - Maintain write protection for user's own data

  2. Security
    - Allow public read access to all responses
    - Restrict write access to authenticated users for their own data
*/

-- Safely drop existing policies
DO $$ 
BEGIN
  -- Drop policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_form_responses' 
    AND policyname = 'Anyone can read responses'
  ) THEN
    DROP POLICY "Anyone can read responses" ON user_form_responses;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_form_responses' 
    AND policyname = 'Users can manage their own responses'
  ) THEN
    DROP POLICY "Users can manage their own responses" ON user_form_responses;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_form_responses' 
    AND policyname = 'Anyone can read all responses'
  ) THEN
    DROP POLICY "Anyone can read all responses" ON user_form_responses;
  END IF;
END $$;

-- Create new policies
CREATE POLICY "Anyone can read all responses"
  ON user_form_responses
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own responses"
  ON user_form_responses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
DO $$ 
BEGIN
  -- Create category index if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'user_form_responses' 
    AND indexname = 'idx_user_form_responses_category'
  ) THEN
    CREATE INDEX idx_user_form_responses_category 
    ON user_form_responses (category);
  END IF;

  -- Create created_at index if it doesn't exist
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