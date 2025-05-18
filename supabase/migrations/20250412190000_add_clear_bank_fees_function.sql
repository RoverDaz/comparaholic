/*
  # Update Clear Bank Fees Function

  1. Changes
    - Modify function to clear ALL bank fees data
    - Remove visitor_id and user_id restrictions
    - Keep SECURITY DEFINER to bypass RLS
*/

-- Drop the old function
DROP FUNCTION IF EXISTS clear_bank_fees_data(text, uuid);

-- Create the new function
CREATE OR REPLACE FUNCTION clear_bank_fees_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete ALL visitor submissions for bank-fees
  DELETE FROM visitor_submissions
  WHERE category = 'bank-fees';

  -- Delete ALL user form responses for bank-fees
  DELETE FROM user_form_responses
  WHERE category = 'bank-fees';
END;
$$; 