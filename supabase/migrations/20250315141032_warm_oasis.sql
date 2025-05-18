/*
  # Update Product Categories

  This migration safely updates the product categories with new values.
  
  1. Changes
    - Updates product categories with new specific categories:
      - Car Insurance
      - Home Insurance
      - Cell Phone Plan
      - Car Payment
      - Mortgage Rate
      - Internet & Cable TV
      - Bank Account Fees
      - Real Estate Broker
    
  2. Safety
    - Uses IF NOT EXISTS for all table creations
    - Safely handles existing data
*/

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES product_categories,
  name text NOT NULL,
  provider text NOT NULL,
  description text,
  features jsonb DEFAULT '{}',
  monthly_cost decimal(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles,
  category_id uuid REFERENCES product_categories,
  name text NOT NULL,
  products uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS (safe to run multiple times)
DO $$ 
BEGIN
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
  ALTER TABLE products ENABLE ROW LEVEL SECURITY;
  ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Create policies (dropping existing ones first to avoid conflicts)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
  DROP POLICY IF EXISTS "Everyone can read product categories" ON product_categories;
  DROP POLICY IF EXISTS "Everyone can read products" ON products;
  DROP POLICY IF EXISTS "Users can manage their own comparisons" ON comparisons;
END $$;

CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Everyone can read product categories"
  ON product_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Everyone can read products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own comparisons"
  ON comparisons FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Clear existing categories and insert new ones
TRUNCATE product_categories CASCADE;

INSERT INTO product_categories (name, slug, description) VALUES
  ('Car Insurance', 'car-insurance', 'Compare auto insurance policies and rates from different providers'),
  ('Home Insurance', 'home-insurance', 'Find the best home insurance coverage for your property'),
  ('Cell Phone Plan', 'cell-phone-plan', 'Compare mobile phone plans and carriers'),
  ('Car Payment', 'car-payment', 'Compare auto loans and leasing options from different lenders'),
  ('Mortgage Rate', 'mortgage-rate', 'Find the best mortgage rates and terms for your home purchase'),
  ('Internet & Cable TV', 'internet-cable', 'Compare internet service providers and cable TV packages'),
  ('Bank Account Fees', 'bank-fees', 'Compare banking fees and account features across institutions'),
  ('Real Estate Broker', 'real-estate-broker', 'Compare real estate agents and their commission rates');