/*
  # Add user responses table

  1. New Tables
    - `user_insurance_responses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `age_range` (text)
      - `current_provider` (text)
      - `vehicle_make` (text)
      - `vehicle_model` (text)
      - `vehicle_year` (text)
      - `license_age` (text)
      - `claims_count` (text)
      - `city` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_insurance_responses` table
    - Add policies for authenticated users to manage their own responses
*/

CREATE TABLE IF NOT EXISTS user_insurance_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  age_range text,
  current_provider text,
  vehicle_make text,
  vehicle_model text,
  vehicle_year text,
  license_age text,
  claims_count text,
  city text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_insurance_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own responses"
  ON user_insurance_responses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);