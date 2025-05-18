/*
  # Initial Schema for Financial Products Comparison Platform

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - References auth.users
      - `email` (text) - User's email
      - `full_name` (text) - User's full name
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `product_categories`
      - `id` (uuid, primary key)
      - `name` (text) - Category name (e.g., Insurance, Banking)
      - `slug` (text) - URL-friendly name
      - `description` (text)
      - `created_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `category_id` (uuid) - References product_categories
      - `name` (text) - Product name
      - `provider` (text) - Company providing the product
      - `description` (text)
      - `features` (jsonb) - Dynamic features specific to category
      - `monthly_cost` (decimal)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `comparisons`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References profiles
      - `category_id` (uuid) - References product_categories
      - `name` (text) - Comparison name
      - `products` (uuid[]) - Array of product IDs being compared
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create tables
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE products (
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

CREATE TABLE comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles,
  category_id uuid REFERENCES product_categories,
  name text NOT NULL,
  products uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Insert initial product categories
INSERT INTO product_categories (name, slug, description) VALUES
  ('Insurance', 'insurance', 'Compare different insurance policies'),
  ('Banking', 'banking', 'Compare bank accounts and services'),
  ('Cable TV', 'cable-tv', 'Compare cable TV and streaming plans'),
  ('Auto Financing', 'auto-financing', 'Compare car loans and leasing options');