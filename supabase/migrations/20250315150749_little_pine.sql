/*
  # Add Insurance Quotes Table

  1. New Tables
    - `insurance_quotes`
      - `id` (uuid, primary key)
      - `provider` (text) - Insurance company name
      - `monthly_premium` (decimal) - Monthly cost
      - `coverage_type` (text) - Type of coverage
      - `driver_age_range` (text) - Age range of driver
      - `vehicle_make` (text) - Make of vehicle
      - `vehicle_model` (text) - Model of vehicle
      - `vehicle_year` (text) - Year of vehicle
      - `license_age` (text) - Age when licensed
      - `claims_count` (text) - Number of claims
      - `city` (text) - City
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policy for authenticated users to read quotes
*/

CREATE TABLE insurance_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  monthly_premium decimal(10,2) NOT NULL,
  coverage_type text NOT NULL,
  driver_age_range text NOT NULL,
  vehicle_make text NOT NULL,
  vehicle_model text NOT NULL,
  vehicle_year text NOT NULL,
  license_age text NOT NULL,
  claims_count text NOT NULL,
  city text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE insurance_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read insurance quotes"
  ON insurance_quotes FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample data
INSERT INTO insurance_quotes (
  provider, monthly_premium, coverage_type, driver_age_range,
  vehicle_make, vehicle_model, vehicle_year, license_age, claims_count, city
) VALUES
  ('AllState', 150.00, 'Comprehensive', '25-34', 'Toyota', 'Camry', '2020', '16', '0', 'Toronto'),
  ('StateFarm', 165.00, 'Comprehensive', '25-34', 'Toyota', 'Camry', '2020', '16', '0', 'Toronto'),
  ('Progressive', 145.00, 'Basic', '25-34', 'Toyota', 'Camry', '2020', '16', '0', 'Toronto'),
  ('Geico', 170.00, 'Premium', '35-44', 'Honda', 'Civic', '2019', '18', '1', 'Vancouver'),
  ('Liberty Mutual', 190.00, 'Premium', '35-44', 'Honda', 'Civic', '2019', '18', '1', 'Vancouver'),
  ('Nationwide', 155.00, 'Basic', '18-24', 'Ford', 'F-150', '2022', '16', '0', 'Calgary'),
  ('Progressive', 200.00, 'Premium', '18-24', 'Ford', 'F-150', '2022', '16', '0', 'Calgary'),
  ('AllState', 180.00, 'Comprehensive', '45-54', 'BMW', '3 Series', '2021', '17', '2', 'Montreal'),
  ('StateFarm', 195.00, 'Premium', '45-54', 'BMW', '3 Series', '2021', '17', '2', 'Montreal');