/*
  # Fix Visitor Submissions Constraint

  1. Changes
    - Remove existing constraint and index safely
    - Clean up any duplicate data
    - Create new unique constraint

  2. Data Integrity
    - Ensures no duplicate submissions per visitor per category
    - Maintains existing data where possible
*/

-- Remove any duplicate entries before modifying constraints
DELETE FROM visitor_submissions a USING visitor_submissions b
WHERE a.id > b.id 
  AND a.visitor_id = b.visitor_id 
  AND a.category = b.category;

-- Drop existing constraint first, then the index
DO $$ 
BEGIN
  ALTER TABLE visitor_submissions 
  DROP CONSTRAINT IF EXISTS visitor_submissions_visitor_id_category_key;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP INDEX IF EXISTS visitor_submissions_visitor_id_category_key;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new unique constraint
ALTER TABLE visitor_submissions
ADD CONSTRAINT visitor_submissions_visitor_id_category_key 
UNIQUE (visitor_id, category);