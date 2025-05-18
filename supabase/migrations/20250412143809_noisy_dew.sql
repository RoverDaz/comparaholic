-- Remove monthly_fee and free_transactions from existing user_form_responses
UPDATE user_form_responses
SET form_data = form_data - 'monthly_fee' - 'free_transactions'
WHERE category = 'bank-fees';

-- Remove monthly_fee and free_transactions from existing visitor_submissions
UPDATE visitor_submissions
SET form_data = form_data - 'monthly_fee' - 'free_transactions'
WHERE category = 'bank-fees';

-- Verify the fields have been removed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM user_form_responses
    WHERE category = 'bank-fees'
    AND (form_data ? 'monthly_fee' OR form_data ? 'free_transactions')
  ) THEN
    RAISE EXCEPTION 'Failed to remove fields from user_form_responses';
  END IF;

  IF EXISTS (
    SELECT 1 FROM visitor_submissions
    WHERE category = 'bank-fees'
    AND (form_data ? 'monthly_fee' OR form_data ? 'free_transactions')
  ) THEN
    RAISE EXCEPTION 'Failed to remove fields from visitor_submissions';
  END IF;
END $$;