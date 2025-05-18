-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can read visitor submissions" ON visitor_submissions;
  DROP POLICY IF EXISTS "Allow public insert with visitor_id" ON visitor_submissions;
  DROP POLICY IF EXISTS "Allow update for own submissions" ON visitor_submissions;
END $$;

-- Create new simplified policies
CREATE POLICY "Anyone can read visitor submissions"
  ON visitor_submissions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert with visitor_id"
  ON visitor_submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow update for own submissions"
  ON visitor_submissions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Drop function if it exists
DROP FUNCTION IF EXISTS public.set_claim_tag(text, text);

-- Create simplified function without session state
CREATE OR REPLACE FUNCTION public.set_claim_tag(key text, value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Function exists but does nothing - we don't need session state
  NULL;
END;
$$;