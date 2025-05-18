-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can read visitor submissions" ON visitor_submissions;
  DROP POLICY IF EXISTS "Allow anonymous inserts" ON visitor_submissions;
  DROP POLICY IF EXISTS "Allow public insert with visitor_id" ON visitor_submissions;
  DROP POLICY IF EXISTS "Allow upsert for known visitor_id" ON visitor_submissions;
  DROP POLICY IF EXISTS "Users can claim submissions" ON visitor_submissions;
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
  WITH CHECK (visitor_id IS NOT NULL);

CREATE POLICY "Allow update for own submissions"
  ON visitor_submissions
  FOR UPDATE
  TO public
  USING (visitor_id = current_setting('visitor.id', true))
  WITH CHECK (visitor_id = current_setting('visitor.id', true));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visitor_submissions_visitor_category
ON visitor_submissions (visitor_id, category);

CREATE INDEX IF NOT EXISTS idx_visitor_submissions_created_at
ON visitor_submissions (created_at DESC);