/*
  # Add Clear Car Payment Function

  1. Changes
    - Create function to clear ALL car payment data
    - Keep SECURITY DEFINER to bypass RLS
*/

-- Create the function
CREATE OR REPLACE FUNCTION clear_car_payment_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete ALL visitor submissions for new-car-payment
  DELETE FROM visitor_submissions
  WHERE category = 'new-car-payment';

  -- Delete ALL user form responses for new-car-payment
  DELETE FROM user_form_responses
  WHERE category = 'new-car-payment';
END;
$$; 