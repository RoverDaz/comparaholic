/*
  # Clean Up Real Estate Broker Data

  1. Changes
    - Remove incomplete real estate broker submissions
    - Only keep records with valid agent_name field
    - Preserve data integrity with proper validation

  2. Data Integrity
    - Only removes invalid/incomplete records
    - Maintains all valid submissions
*/

-- Delete records where agent_name is missing or empty
DELETE FROM user_form_responses
WHERE category = 'real-estate-broker'
AND (
  form_data->>'agent_name' IS NULL
  OR form_data->>'agent_name' = ''
  OR form_data->>'agent_name' = 'null'
  OR NOT form_data ? 'agent_name'
);

-- Add constraint to ensure agent_name is always present
ALTER TABLE user_form_responses
DROP CONSTRAINT IF EXISTS check_real_estate_broker_data;

ALTER TABLE user_form_responses
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