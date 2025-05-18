/*
  # Clear All Visitor Submissions

  1. Changes
    - Safely truncate visitor_submissions table
    - Preserve table structure and policies
    - Reset sequence if any exists

  2. Security
    - Maintain existing RLS policies
    - Keep table structure intact
*/

-- Truncate the visitor_submissions table
TRUNCATE TABLE visitor_submissions;

-- Reset the sequence if it exists (for auto-incrementing IDs)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.sequences 
    WHERE sequence_schema = 'public' 
    AND sequence_name = 'visitor_submissions_id_seq'
  ) THEN
    ALTER SEQUENCE visitor_submissions_id_seq RESTART;
  END IF;
END $$;