/*
  # Fix Car Insurance Form Validation

  1. Changes
    - Drop existing constraint
    - Add new constraint that validates only when all fields are present
    - Clean up any invalid data
    - Allow partial form submissions during the form filling process

  2. Data Integrity
    - Preserves valid submissions
    - Ensures data consistency
    - Allows progressive form filling
*/

-- Drop existing constraint
ALTER TABLE visitor_submissions DROP CONSTRAINT IF EXISTS valid_car_insurance_data;

-- Clean up any invalid data
DELETE FROM visitor_submissions
WHERE category = 'car-insurance'
AND form_data ? 'annual_premium'
AND (
  form_data->>'annual_premium' IS NULL
  OR form_data->>'annual_premium' = ''
  OR form_data->>'annual_premium' NOT SIMILAR TO '[0-9]+(\.[0-9]+)?'
  OR CAST(form_data->>'annual_premium' AS numeric) <= 0
);

-- Add new validation constraint that only checks complete submissions
ALTER TABLE visitor_submissions
ADD CONSTRAINT valid_car_insurance_data
CHECK (
  category != 'car-insurance'
  OR (
    -- If annual_premium exists, validate all required fields
    NOT (form_data ? 'annual_premium')
    OR (
      form_data->>'annual_premium' ~ '^[0-9]+(\.[0-9]+)?$'
      AND CAST(form_data->>'annual_premium' AS numeric) > 0
      AND form_data->>'age' IS NOT NULL
      AND form_data->>'current_provider' IS NOT NULL
      AND form_data->>'make' IS NOT NULL
      AND form_data->>'model' IS NOT NULL
      AND form_data->>'year' IS NOT NULL
      AND form_data->>'license_age' IS NOT NULL
      AND form_data->>'claims' IS NOT NULL
      AND form_data->>'city' IS NOT NULL
    )
  )
);