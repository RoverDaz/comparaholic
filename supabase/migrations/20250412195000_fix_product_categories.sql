/*
  # Fix Product Categories Table and Policies

  1. Changes
    - Recreate product_categories table if it doesn't exist
    - Add proper RLS policies
    - Insert default categories
*/

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can read product categories" ON product_categories;
DROP POLICY IF EXISTS "Anyone can read product categories" ON product_categories;

-- Create new policy for public access
CREATE POLICY "Anyone can read product categories"
  ON product_categories
  FOR SELECT
  TO public
  USING (true);

-- Insert default categories if they don't exist
INSERT INTO product_categories (name, slug, description)
VALUES
  ('Car Insurance', 'car-insurance', 'Compare auto insurance policies and rates from different providers'),
  ('Home Insurance', 'home-insurance', 'Find the best home insurance coverage for your property'),
  ('Cell Phone Plan', 'cell-phone-plan', 'Compare mobile phone plans and carriers'),
  ('Car Payment', 'car-payment', 'Compare auto loans and leasing options from different lenders'),
  ('Mortgage Rate', 'mortgage-rate', 'Find the best mortgage rates and terms for your home purchase'),
  ('Internet & Cable TV', 'internet-cable', 'Compare internet service providers and cable TV packages'),
  ('Bank Account Fees', 'bank-fees', 'Compare banking fees and account features across institutions'),
  ('Real Estate Broker', 'real-estate-broker', 'Compare real estate agents and their commission rates')
ON CONFLICT (slug) DO NOTHING; 