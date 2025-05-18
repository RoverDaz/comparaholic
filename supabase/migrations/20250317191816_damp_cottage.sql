/*
  # Fix Visitor Submissions Table and Policies

  1. Changes
    - Safely create visitor_submissions table if it doesn't exist
    - Drop existing policies to avoid conflicts
    - Recreate policies with proper permissions
    - Add proper foreign key constraints
*/

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can read visitor submissions" ON visitor_submissions;
  DROP POLICY IF EXISTS "Visitors can create submissions" ON visitor_submissions;
  DROP POLICY IF EXISTS "Users can claim submissions" ON visitor_submissions;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS visitor_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  form_data jsonb NOT NULL DEFAULT '{}',
  visitor_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  claimed_by uuid REFERENCES auth.users,
  claimed_at timestamptz,
  UNIQUE(visitor_id, category)
);

-- Enable RLS
ALTER TABLE visitor_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read visitor submissions"
  ON visitor_submissions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Visitors can create submissions"
  ON visitor_submissions
  FOR INSERT
  TO public
  WITH CHECK (claimed_by IS NULL);

CREATE POLICY "Users can claim submissions"
  ON visitor_submissions
  FOR UPDATE
  TO authenticated
  USING (claimed_by IS NULL)
  WITH CHECK (auth.uid() = claimed_by);