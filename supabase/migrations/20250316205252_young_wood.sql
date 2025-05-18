/*
  # Add User Form Responses Table

  1. New Tables
    - `user_form_responses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `category` (text)
      - `form_data` (jsonb)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `user_form_responses` table
    - Add policies for authenticated users to manage their own responses
*/

CREATE TABLE IF NOT EXISTS user_form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  category text NOT NULL,
  form_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_form_responses ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX user_form_responses_user_category_idx ON user_form_responses (user_id, category);

-- Allow users to manage their own responses
CREATE POLICY "Users can manage their own responses"
  ON user_form_responses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);