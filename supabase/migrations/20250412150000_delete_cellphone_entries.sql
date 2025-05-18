/*
  # Create Delete Cellphone Entries Function

  1. Changes
    - Create function to delete cellphone entries
    - Delete from both user_form_responses and visitor_submissions
    - Use SECURITY DEFINER to ensure proper permissions

  2. Security
    - Function runs with definer's permissions
    - Maintains data integrity
*/

CREATE OR REPLACE FUNCTION delete_cellphone_entries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete from user_form_responses
  DELETE FROM user_form_responses
  WHERE category = 'cell-phone-plan';

  -- Delete from visitor_submissions
  DELETE FROM visitor_submissions
  WHERE category = 'cell-phone-plan';
END;
$$; 