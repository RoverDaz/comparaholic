-- Create a function to delete all real estate broker entries
CREATE OR REPLACE FUNCTION delete_real_estate_broker_entries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete from user_form_responses
  DELETE FROM user_form_responses
  WHERE category = 'real-estate-broker';

  -- Delete from visitor_submissions
  DELETE FROM visitor_submissions
  WHERE category = 'real-estate-broker';
END;
$$; 