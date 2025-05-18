/*
  # Fix Visitor Submissions Visibility

  1. Changes
    - Drop and recreate RLS policies for visitor_submissions
    - Add function to handle visitor ID claims
    - Ensure proper indexes exist for performance

  2. Security
    - Allow public read access to all submissions
    - Allow visitors to create and update their own submissions
    - Maintain data integrity with proper constraints
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can read visitor submissions" ON visitor_submissions;
  DROP POLICY IF EXISTS "Allow public insert with visitor_id" ON visitor_submissions;
  DROP POLICY IF EXISTS "Allow update for own submissions" ON visitor_submissions;
END $$;

-- Create new policies with proper permissions
CREATE POLICY "Anyone can read visitor submissions"
  ON visitor_submissions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert with visitor_id"
  ON visitor_submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow update for own submissions"
  ON visitor_submissions
  FOR UPDATE
  TO public
  USING (
    visitor_id = COALESCE(current_setting('visitor.id'::text, true), '')
  )
  WITH CHECK (
    visitor_id = COALESCE(current_setting('visitor.id'::text, true), '')
  );

-- Create or replace the set_claim_tag function
CREATE OR REPLACE FUNCTION public.set_claim_tag(key text, value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow setting specific claim keys for security
  IF key NOT IN ('visitor.id') THEN
    RAISE EXCEPTION 'Invalid claim key';
  END IF;
  
  -- Set the configuration value
  PERFORM set_config(key, value, false);
END;
$$;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_visitor_submissions_visitor_category
ON visitor_submissions (visitor_id, category);

CREATE INDEX IF NOT EXISTS idx_visitor_submissions_created_at
ON visitor_submissions (created_at DESC);