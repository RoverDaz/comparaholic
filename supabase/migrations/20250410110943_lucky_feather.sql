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
  USING (visitor_id = current_setting('visitor.id'::text, true))
  WITH CHECK (visitor_id = current_setting('visitor.id'::text, true));