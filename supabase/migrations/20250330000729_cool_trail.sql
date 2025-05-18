-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable read access for everyone" ON user_form_responses;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_form_responses;
  DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_form_responses;
  DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_form_responses;
END $$;

-- Create new simplified policies with proper permissions
CREATE POLICY "Enable read access for everyone"
ON user_form_responses
FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON user_form_responses
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for users based on user_id"
ON user_form_responses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id"
ON user_form_responses
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Ensure proper indexes exist
DROP INDEX IF EXISTS idx_user_form_responses_category_created;
DROP INDEX IF EXISTS idx_user_form_responses_user_category;

CREATE INDEX idx_user_form_responses_category_created 
ON user_form_responses (category, created_at DESC);

CREATE INDEX idx_user_form_responses_user_category 
ON user_form_responses (user_id, category);

-- Add trigger for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_updated_at ON user_form_responses;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON user_form_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();