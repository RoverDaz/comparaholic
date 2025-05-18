/*
  # Add Deleted Column

  1. Changes
    - Add deleted column to user_form_responses
    - Add deleted column to visitor_submissions
    - Set default value to false
    - Add index for better performance
*/

-- Add deleted column to user_form_responses
ALTER TABLE user_form_responses
ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_form_responses_deleted
ON user_form_responses (deleted);

-- Add deleted column to visitor_submissions
ALTER TABLE visitor_submissions
ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_visitor_submissions_deleted
ON visitor_submissions (deleted); 