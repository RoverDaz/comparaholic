/*
  # Implement flexible user responses schema

  1. New Tables
    - `category_forms`: Stores form definitions for each category
      - `id` (uuid, primary key)
      - `category_id` (uuid, references product_categories)
      - `field_name` (text)
      - `field_type` (text)
      - `field_label` (text)
      - `field_options` (jsonb)
      - `is_required` (boolean)
      - `display_order` (int)
      
    - `user_responses`: Stores all user responses
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `category_id` (uuid, references product_categories)
      - `response_data` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own responses
    - Add policies for reading form definitions

  3. Data Migration
    - Migrate existing car insurance responses to the new format
*/

-- Create category_forms table
CREATE TABLE category_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES product_categories(id),
  field_name text NOT NULL,
  field_type text NOT NULL,
  field_label text NOT NULL,
  field_options jsonb,
  is_required boolean DEFAULT false,
  display_order int NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (category_id, field_name)
);

-- Create user_responses table
CREATE TABLE user_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  category_id uuid REFERENCES product_categories(id),
  response_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, category_id)
);

-- Enable RLS
ALTER TABLE category_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;

-- Policies for category_forms
CREATE POLICY "Anyone can read category forms"
  ON category_forms
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Policies for user_responses
CREATE POLICY "Users can manage their own responses"
  ON user_responses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert car insurance form definition
INSERT INTO category_forms (
  category_id,
  field_name,
  field_type,
  field_label,
  field_options,
  is_required,
  display_order
) 
SELECT 
  pc.id as category_id,
  field_name,
  field_type,
  field_label,
  field_options,
  is_required,
  display_order
FROM 
  product_categories pc,
  json_to_recordset('[
    {
      "field_name": "age_range",
      "field_type": "select",
      "field_label": "Age Range",
      "field_options": ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"],
      "is_required": true,
      "display_order": 1
    },
    {
      "field_name": "current_provider",
      "field_type": "select",
      "field_label": "Current Provider",
      "field_options": ["AllState", "StateFarm", "Progressive", "Geico", "Liberty Mutual", "Other", "None (First Time)"],
      "is_required": true,
      "display_order": 2
    },
    {
      "field_name": "annual_premium",
      "field_type": "number",
      "field_label": "Annual Premium",
      "field_options": null,
      "is_required": true,
      "display_order": 3
    },
    {
      "field_name": "vehicle_make",
      "field_type": "select",
      "field_label": "Vehicle Make",
      "field_options": ["Toyota", "Honda", "Ford", "Chevrolet", "BMW", "Mercedes", "Other"],
      "is_required": true,
      "display_order": 4
    },
    {
      "field_name": "vehicle_model",
      "field_type": "select",
      "field_label": "Vehicle Model",
      "field_options": [],
      "is_required": true,
      "display_order": 5
    },
    {
      "field_name": "vehicle_year",
      "field_type": "select",
      "field_label": "Vehicle Year",
      "field_options": [],
      "is_required": true,
      "display_order": 6
    },
    {
      "field_name": "license_age",
      "field_type": "select",
      "field_label": "License Age",
      "field_options": [],
      "is_required": true,
      "display_order": 7
    },
    {
      "field_name": "claims_count",
      "field_type": "select",
      "field_label": "Claims Count",
      "field_options": ["0", "1", "2", "3", "4", "5+"],
      "is_required": true,
      "display_order": 8
    },
    {
      "field_name": "city",
      "field_type": "select",
      "field_label": "City",
      "field_options": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton", "Other"],
      "is_required": true,
      "display_order": 9
    }
  ]'::json) as x(
    field_name text,
    field_type text,
    field_label text,
    field_options jsonb,
    is_required boolean,
    display_order int
  )
WHERE pc.slug = 'car-insurance';

-- Migrate existing user responses to the new format
INSERT INTO user_responses (user_id, category_id, response_data)
SELECT 
  uir.user_id,
  pc.id as category_id,
  json_build_object(
    'age_range', uir.age_range,
    'current_provider', uir.current_provider,
    'annual_premium', uir.annual_premium,
    'vehicle_make', uir.vehicle_make,
    'vehicle_model', uir.vehicle_model,
    'vehicle_year', uir.vehicle_year,
    'license_age', uir.license_age,
    'claims_count', uir.claims_count,
    'city', uir.city
  )::jsonb as response_data
FROM 
  user_insurance_responses uir
  CROSS JOIN (
    SELECT id 
    FROM product_categories 
    WHERE slug = 'car-insurance'
    LIMIT 1
  ) pc;