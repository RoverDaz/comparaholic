/*
  # Add Clear Car Insurance Function

  1. Changes
    - Create function to clear ALL car insurance data
    - Keep SECURITY DEFINER to bypass RLS
*/

-- Create the function
CREATE OR REPLACE FUNCTION clear_car_insurance_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete ALL visitor submissions for car-insurance
  DELETE FROM visitor_submissions
  WHERE category = 'car-insurance';

  -- Delete ALL user form responses for car-insurance
  DELETE FROM user_form_responses
  WHERE category = 'car-insurance';
END;
$$; 