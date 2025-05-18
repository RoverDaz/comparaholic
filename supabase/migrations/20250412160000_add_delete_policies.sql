/*
  # Add Delete Policies for Visitor Submissions

  1. Changes
    - Add policy for visitors to delete their own submissions
    - Add policy for authenticated users to delete their claimed submissions
    - Maintain data integrity and security

  2. Security
    - Visitors can only delete their own submissions
    - Authenticated users can delete their claimed submissions
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow delete for own submissions" ON visitor_submissions;
  DROP POLICY IF EXISTS "Allow delete for claimed submissions" ON visitor_submissions;
END $$;

-- Create policy for visitors to delete their own submissions
CREATE POLICY "Allow delete for own submissions"
  ON visitor_submissions
  FOR DELETE
  TO public
  USING (visitor_id = current_setting('visitor.id', true));

-- Create policy for authenticated users to delete their claimed submissions
CREATE POLICY "Allow delete for claimed submissions"
  ON visitor_submissions
  FOR DELETE
  TO authenticated
  USING (claimed_by = auth.uid()); 