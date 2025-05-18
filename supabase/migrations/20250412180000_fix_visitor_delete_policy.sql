/*
  # Fix Visitor Delete Policy

  1. Changes
    - Drop existing delete policies
    - Create new simplified delete policy
    - Allow visitors to delete their own submissions
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow delete for own submissions" ON visitor_submissions;
  DROP POLICY IF EXISTS "Allow delete for claimed submissions" ON visitor_submissions;
END $$;

-- Create new simplified delete policy
CREATE POLICY "Allow delete for own submissions"
  ON visitor_submissions
  FOR DELETE
  TO public
  USING (visitor_id = current_setting('visitor.id', true) OR claimed_by = auth.uid()); 