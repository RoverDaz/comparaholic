/*
  # Add Clear Bank Fees Procedure

  1. Changes
    - Create stored procedure to clear bank fees data
    - Allow both visitor and user data deletion
    - Use SECURITY DEFINER to bypass RLS
*/

-- Create the procedure
CREATE OR REPLACE FUNCTION clear_bank_fees_data(
  p_visitor_id text,
  p_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete visitor submissions
  DELETE FROM visitor_submissions
  WHERE category = 'bank-fees'
  AND (
    (p_visitor_id IS NOT NULL AND visitor_id = p_visitor_id)
    OR (p_user_id IS NOT NULL AND claimed_by = p_user_id)
  );

  -- Delete user form responses if user_id is provided
  IF p_user_id IS NOT NULL THEN
    DELETE FROM user_form_responses
    WHERE category = 'bank-fees'
    AND user_id = p_user_id;
  END IF;
END;
$$; 