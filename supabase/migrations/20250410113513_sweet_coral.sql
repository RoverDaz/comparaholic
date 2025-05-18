/*
  # Create User Form Responses Table

  1. New Tables
    - `user_form_responses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `category` (text)
      - `form_data` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their own responses
    - Add policy for public read access

  3. Indexes
    - Unique index on user_id and category combination
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS user_form_responses;

-- Create table
CREATE TABLE user_form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  category text NOT NULL,
  form_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_form_responses ENABLE ROW LEVEL SECURITY;

-- Create unique index for user_id and category combination
CREATE UNIQUE INDEX user_form_responses_user_category_idx 
ON user_form_responses (user_id, category);

-- Create policies
CREATE POLICY "Enable read access for everyone"
  ON user_form_responses
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON user_form_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

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

-- Create trigger for updating updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON user_form_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();