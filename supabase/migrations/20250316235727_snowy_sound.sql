/*
  # Ensure User Form Responses Persistence

  1. Table Creation (only if not exists)
    - `user_form_responses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `category` (text)
      - `form_data` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS if not enabled
    - Ensure policies exist
    - Add cascade delete protection

  3. Indexes
    - Ensure unique index exists
*/

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE RESTRICT,
  category text NOT NULL,
  form_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_form_responses_user_category_unique UNIQUE (user_id, category)
);

-- Enable RLS (if not already enabled)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_form_responses' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE user_form_responses ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create or replace policies
DROP POLICY IF EXISTS "Anyone can read responses" ON user_form_responses;
DROP POLICY IF EXISTS "Users can manage their own responses" ON user_form_responses;

CREATE POLICY "Anyone can read responses"
  ON user_form_responses
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own responses"
  ON user_form_responses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure trigger exists
DROP TRIGGER IF EXISTS set_updated_at ON user_form_responses;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON user_form_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();