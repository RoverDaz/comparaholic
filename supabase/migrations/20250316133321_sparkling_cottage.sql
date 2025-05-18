/*
  # Fix Insurance Data Access

  1. Changes
    - Ensures RLS is properly configured
    - Reinserts sample insurance quotes
    - Makes data accessible to all users (authenticated and public)

  2. Security
    - Enables RLS on insurance_quotes table
    - Creates permissive policies for data access
*/

-- Enable RLS
ALTER TABLE insurance_quotes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can read insurance quotes" ON insurance_quotes;
DROP POLICY IF EXISTS "Everyone can read insurance quotes" ON insurance_quotes;

-- Create a permissive policy for reading quotes (both authenticated and public)
CREATE POLICY "Everyone can read insurance quotes"
ON insurance_quotes
FOR SELECT
TO PUBLIC
USING (true);

-- Clear existing data
TRUNCATE TABLE insurance_quotes;

-- Insert sample data
INSERT INTO insurance_quotes (
  provider, monthly_premium, coverage_type, driver_age_range,
  vehicle_make, vehicle_model, vehicle_year, license_age, claims_count, city
) VALUES
  -- Toyota Camry Examples (25-34 age group)
  ('AllState', 150.00, 'Comprehensive', '25-34', 'Toyota', 'Camry', '2020', '16', '0', 'Toronto'),
  ('StateFarm', 165.00, 'Basic', '25-34', 'Toyota', 'Camry', '2020', '16', '0', 'Toronto'),
  ('Progressive', 175.00, 'Premium', '25-34', 'Toyota', 'Camry', '2020', '16', '0', 'Toronto'),
  ('Geico', 145.00, 'Basic', '25-34', 'Toyota', 'Camry', '2020', '16', '0', 'Toronto'),
  ('Liberty Mutual', 180.00, 'Premium', '25-34', 'Toyota', 'Camry', '2020', '16', '0', 'Toronto'),

  -- Honda Civic Examples (18-24 age group)
  ('AllState', 220.00, 'Comprehensive', '18-24', 'Honda', 'Civic', '2021', '16', '0', 'Vancouver'),
  ('StateFarm', 235.00, 'Basic', '18-24', 'Honda', 'Civic', '2021', '16', '0', 'Vancouver'),
  ('Progressive', 245.00, 'Premium', '18-24', 'Honda', 'Civic', '2021', '16', '0', 'Vancouver'),
  ('Geico', 215.00, 'Basic', '18-24', 'Honda', 'Civic', '2021', '16', '0', 'Vancouver'),
  ('Liberty Mutual', 250.00, 'Premium', '18-24', 'Honda', 'Civic', '2021', '16', '0', 'Vancouver'),

  -- Ford F-150 Examples (35-44 age group)
  ('AllState', 180.00, 'Comprehensive', '35-44', 'Ford', 'F-150', '2022', '17', '1', 'Calgary'),
  ('StateFarm', 195.00, 'Basic', '35-44', 'Ford', 'F-150', '2022', '17', '1', 'Calgary'),
  ('Progressive', 205.00, 'Premium', '35-44', 'Ford', 'F-150', '2022', '17', '1', 'Calgary'),
  ('Geico', 175.00, 'Basic', '35-44', 'Ford', 'F-150', '2022', '17', '1', 'Calgary'),
  ('Liberty Mutual', 210.00, 'Premium', '35-44', 'Ford', 'F-150', '2022', '17', '1', 'Calgary'),

  -- BMW 3 Series Examples (45-54 age group)
  ('AllState', 280.00, 'Comprehensive', '45-54', 'BMW', '3 Series', '2023', '18', '0', 'Montreal'),
  ('StateFarm', 295.00, 'Basic', '45-54', 'BMW', '3 Series', '2023', '18', '0', 'Montreal'),
  ('Progressive', 305.00, 'Premium', '45-54', 'BMW', '3 Series', '2023', '18', '0', 'Montreal'),
  ('Geico', 275.00, 'Basic', '45-54', 'BMW', '3 Series', '2023', '18', '0', 'Montreal'),
  ('Liberty Mutual', 310.00, 'Premium', '45-54', 'BMW', '3 Series', '2023', '18', '0', 'Montreal'),

  -- Mercedes C-Class Examples (55-64 age group)
  ('AllState', 290.00, 'Comprehensive', '55-64', 'Mercedes', 'C-Class', '2022', '18', '0', 'Ottawa'),
  ('StateFarm', 305.00, 'Basic', '55-64', 'Mercedes', 'C-Class', '2022', '18', '0', 'Ottawa'),
  ('Progressive', 315.00, 'Premium', '55-64', 'Mercedes', 'C-Class', '2022', '18', '0', 'Ottawa'),
  ('Geico', 285.00, 'Basic', '55-64', 'Mercedes', 'C-Class', '2022', '18', '0', 'Ottawa'),
  ('Liberty Mutual', 320.00, 'Premium', '55-64', 'Mercedes', 'C-Class', '2022', '18', '0', 'Ottawa'),

  -- Additional Vehicles and Age Groups
  ('AllState', 160.00, 'Comprehensive', '65+', 'Toyota', 'RAV4', '2021', '16', '0', 'Toronto'),
  ('Progressive', 185.00, 'Premium', '65+', 'Honda', 'CR-V', '2022', '16', '0', 'Vancouver'),
  ('Geico', 170.00, 'Basic', '25-34', 'Chevrolet', 'Malibu', '2020', '17', '0', 'Calgary'),
  ('StateFarm', 200.00, 'Premium', '35-44', 'Ford', 'Explorer', '2023', '17', '0', 'Montreal'),
  ('Liberty Mutual', 225.00, 'Comprehensive', '45-54', 'BMW', '5 Series', '2022', '18', '1', 'Ottawa');