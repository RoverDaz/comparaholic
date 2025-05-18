/*
  # Clean up invalid visitor submissions and add validation

  1. Changes
    - Remove visitor submissions with invalid data
    - Add CHECK constraints to ensure valid numeric values
    - Add NOT NULL constraints for required fields

  2. Data Integrity
    - Only removes submissions with invalid data
    - Preserves all valid submissions
*/

-- Remove visitor submissions with invalid annual_premium
DELETE FROM visitor_submissions
WHERE category = 'car-insurance'
AND (
  form_data->>'annual_premium' IS NULL
  OR form_data->>'annual_premium' = ''
  OR form_data->>'annual_premium' NOT SIMILAR TO '[0-9]+(\.[0-9]+)?'
  OR CAST(form_data->>'annual_premium' AS numeric) <= 0
);

-- Remove visitor submissions with missing required fields
DELETE FROM visitor_submissions
WHERE category = 'car-insurance'
AND (
  form_data->>'age' IS NULL
  OR form_data->>'current_provider' IS NULL
  OR form_data->>'make' IS NULL
  OR form_data->>'model' IS NULL
  OR form_data->>'year' IS NULL
  OR form_data->>'license_age' IS NULL
  OR form_data->>'claims' IS NULL
  OR form_data->>'city' IS NULL
);

-- Add validation check constraint
ALTER TABLE visitor_submissions
ADD CONSTRAINT valid_car_insurance_data
CHECK (
  category != 'car-insurance'
  OR (
    form_data->>'annual_premium' IS NOT NULL
    AND form_data->>'annual_premium' ~ '^[0-9]+(\.[0-9]+)?$'
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
);