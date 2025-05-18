/*
  # Add Visitor Submissions Table

  1. New Tables
    - `visitor_submissions`
      - `id` (uuid, primary key)
      - `category` (text)
      - `form_data` (jsonb)
      - `visitor_id` (text) - Cookie-based identifier
      - `created_at` (timestamp)
      - `claimed_by` (uuid) - References auth.users when claimed
      - `claimed_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policy for public read/write access
    - Add policy for authenticated users to claim submissions
*/

CREATE TABLE visitor_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  form_data jsonb NOT NULL DEFAULT '{}',
  visitor_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  claimed_by uuid REFERENCES auth.users,
  claimed_at timestamptz,
  UNIQUE(visitor_id, category)
);

ALTER TABLE visitor_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read visitor submissions
CREATE POLICY "Anyone can read visitor submissions"
  ON visitor_submissions
  FOR SELECT
  TO public
  USING (true);

-- Allow visitors to create submissions
CREATE POLICY "Visitors can create submissions"
  ON visitor_submissions
  FOR INSERT
  TO public
  WITH CHECK (claimed_by IS NULL);

-- Allow authenticated users to claim submissions
CREATE POLICY "Users can claim submissions"
  ON visitor_submissions
  FOR UPDATE
  TO authenticated
  USING (claimed_by IS NULL)
  WITH CHECK (auth.uid() = claimed_by);