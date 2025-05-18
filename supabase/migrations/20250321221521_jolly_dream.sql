-- Drop existing constraint
ALTER TABLE visitor_submissions DROP CONSTRAINT IF EXISTS valid_car_insurance_data;

-- Clean up any invalid data
DELETE FROM visitor_submissions
WHERE category = 'car-insurance'
AND (
  form_data->>'annual_premium' IS NULL
  OR form_data->>'annual_premium' = ''
  OR NOT form_data->>'annual_premium' ~ '^[0-9]+(\.[0-9]+)?$'
  OR CAST(form_data->>'annual_premium' AS numeric) <= 0
  OR form_data->>'age' IS NULL
  OR form_data->>'current_provider' IS NULL
  OR form_data->>'make' IS NULL
  OR form_data->>'model' IS NULL
  OR form_data->>'year' IS NULL
  OR form_data->>'license_age' IS NULL
  OR form_data->>'claims' IS NULL
  OR form_data->>'city' IS NULL
);

-- Add new validation constraint
ALTER TABLE visitor_submissions
ADD CONSTRAINT valid_car_insurance_data
CHECK (
  category != 'car-insurance'
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
);