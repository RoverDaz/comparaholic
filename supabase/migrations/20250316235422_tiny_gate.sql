/*
  # Fix relationships between user_form_responses and profiles

  1. Changes
    - Drop existing user_form_responses table
    - Recreate with proper foreign key relationships
    - Re-enable RLS and policies
*/

-- Drop existing table and its policies
DROP TABLE IF EXISTS user_form_responses CASCADE;

-- Create table with proper relationships
CREATE TABLE user_form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  form_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE user_form_responses ENABLE ROW LEVEL SECURITY;

-- Create unique index
CREATE UNIQUE INDEX user_form_responses_user_category_idx 
ON user_form_responses (user_id, category);

-- Create policies
CREATE POLICY "Users can manage their own responses"
  ON user_form_responses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read responses"
  ON user_form_responses
  FOR SELECT
  TO public
  USING (true);