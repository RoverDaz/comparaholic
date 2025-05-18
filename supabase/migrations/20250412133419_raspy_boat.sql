/*
  # Clean Visitor Submissions Data

  1. Changes
    - Remove visitor submissions without agent_name
    - Add constraint to prevent future incomplete submissions
    - Maintain existing data integrity

  2. Data Integrity
    - Only removes invalid/incomplete records
    - Preserves all valid submissions
*/

-- Delete records where agent_name is missing or empty
DELETE FROM visitor_submissions
WHERE category = 'real-estate-broker'
AND (
  form_data->>'agent_name' IS NULL
  OR form_data->>'agent_name' = ''
  OR form_data->>'agent_name' = 'null'
  OR NOT form_data ? 'agent_name'
);

-- Add constraint to ensure agent_name is always present for real estate broker submissions
ALTER TABLE visitor_submissions
DROP CONSTRAINT IF EXISTS check_real_estate_broker_data;

ALTER TABLE visitor_submissions
ADD CONSTRAINT check_real_estate_broker_data
CHECK (
  category != 'real-estate-broker'
  OR (
    form_data ? 'agent_name'
    AND form_data->>'agent_name' IS NOT NULL
    AND form_data->>'agent_name' != ''
    AND form_data->>'agent_name' != 'null'
  )
);

-- Create index for real estate broker submissions
CREATE INDEX IF NOT EXISTS idx_real_estate_broker_submissions
ON visitor_submissions (category, created_at DESC)
WHERE category = 'real-estate-broker';