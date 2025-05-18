/*
  # Add user form responses table and policies

  1. New Tables
    - `user_form_responses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `category` (text)
      - `form_data` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_form_responses` table
    - Add policy for authenticated users to manage their own responses
    - Add policy for public to read all responses
*/

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  category text NOT NULL,
  form_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_form_responses ENABLE ROW LEVEL SECURITY;

-- Safely create unique index
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'user_form_responses_user_category_idx'
  ) THEN
    CREATE UNIQUE INDEX user_form_responses_user_category_idx 
    ON user_form_responses (user_id, category);
  END IF;
END $$;

-- Safely create policies
DO $$
BEGIN
  -- Check and create ALL policy for authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_form_responses' 
    AND policyname = 'Users can manage their own responses'
  ) THEN
    CREATE POLICY "Users can manage their own responses"
      ON user_form_responses
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check and create SELECT policy for public
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_form_responses' 
    AND policyname = 'Anyone can read responses'
  ) THEN
    CREATE POLICY "Anyone can read responses"
      ON user_form_responses
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;