/*
  # Add annual premium to user insurance responses

  1. Changes
    - Add annual_premium column to user_insurance_responses table
*/

ALTER TABLE user_insurance_responses
ADD COLUMN IF NOT EXISTS annual_premium numeric(10,2);