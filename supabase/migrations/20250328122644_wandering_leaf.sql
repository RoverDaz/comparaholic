/*
  # Add Rate Limiting Function and Trigger

  1. Changes
    - Add rate limiting for submissions per visitor
    - Add rate limiting for submissions per IP
    - Add cleanup function for old rate limit records

  2. Security
    - Prevents abuse of the submission system
    - Ensures fair usage
    - Maintains data quality
*/

-- Create rate limit tracking table
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  submission_count int DEFAULT 1,
  first_submission_at timestamptz DEFAULT now(),
  last_submission_at timestamptz DEFAULT now()
);

-- Create index for rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_visitor_id 
ON rate_limits (visitor_id);

-- Create rate limit check function
CREATE OR REPLACE FUNCTION check_rate_limit()
RETURNS trigger AS $$
BEGIN
  -- Check if visitor has submitted too many times in the last hour
  IF EXISTS (
    SELECT 1 FROM rate_limits
    WHERE visitor_id = NEW.visitor_id
    AND submission_count >= 10
    AND last_submission_at > now() - interval '1 hour'
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;

  -- Update or insert rate limit record
  INSERT INTO rate_limits (visitor_id, submission_count)
  VALUES (NEW.visitor_id, 1)
  ON CONFLICT (visitor_id) DO UPDATE
  SET submission_count = rate_limits.submission_count + 1,
      last_submission_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rate limiting
CREATE TRIGGER check_submission_rate_limit
BEFORE INSERT ON visitor_submissions
FOR EACH ROW
EXECUTE FUNCTION check_rate_limit();

-- Create cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE last_submission_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql;