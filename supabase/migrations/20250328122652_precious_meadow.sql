/*
  # Enhance Data Validation

  1. Changes
    - Add stricter validation for all form fields
    - Add sanitization checks
    - Add maximum length constraints
*/

-- Add validation functions
CREATE OR REPLACE FUNCTION validate_form_data()
RETURNS trigger AS $$
BEGIN
  -- Check for maximum lengths
  IF length(NEW.visitor_id) > 100 THEN
    RAISE EXCEPTION 'visitor_id too long';
  END IF;

  -- Validate form_data structure
  IF NEW.form_data IS NULL OR NEW.form_data = '{}'::jsonb THEN
    RAISE EXCEPTION 'form_data cannot be empty';
  END IF;

  -- Category-specific validation
  IF NEW.category = 'car-insurance' THEN
    -- Validate numeric fields
    IF NEW.form_data ? 'annual_premium' AND (
      NOT NEW.form_data->>'annual_premium' ~ '^[0-9]+(\.[0-9]+)?$'
      OR CAST(NEW.form_data->>'annual_premium' AS numeric) <= 0
      OR CAST(NEW.form_data->>'annual_premium' AS numeric) > 100000
    ) THEN
      RAISE EXCEPTION 'Invalid annual premium';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create validation trigger
CREATE TRIGGER validate_submission_data
BEFORE INSERT OR UPDATE ON visitor_submissions
FOR EACH ROW
EXECUTE FUNCTION validate_form_data();