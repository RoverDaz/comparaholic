/*
  # Fix Data Visibility Issues

  1. Changes
    - Update RLS policies for user_form_responses table
    - Ensure all submissions are visible to everyone
    - Maintain write protection for user's own data

  2. Security
    - Allow public read access to all responses
    - Restrict write access to authenticated users for their own data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read responses" ON user_form_responses;
DROP POLICY IF EXISTS "Users can manage their own responses" ON user_form_responses;

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
CREATE INDEX IF NOT EXISTS idx_user_form_responses_category 
ON user_form_responses (category);

CREATE INDEX IF NOT EXISTS idx_user_form_responses_created_at 
ON user_form_responses (created_at DESC);