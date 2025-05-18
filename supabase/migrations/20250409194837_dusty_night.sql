/*
  # Remove Rate Limiting

  1. Changes
    - Drop rate_limits table
    - Drop rate limiting trigger and function
    - Clean up any related constraints

  2. Security
    - Maintains other security measures
    - Keeps data validation intact
*/

-- Drop the trigger from visitor_submissions
DROP TRIGGER IF EXISTS check_submission_rate_limit ON visitor_submissions;

-- Drop the rate limit check function
DROP FUNCTION IF EXISTS check_rate_limit();

-- Drop the rate_limits table
DROP TABLE IF EXISTS rate_limits;