/*
  # Add More Insurance Quote Examples

  1. Changes
    - Add more sample insurance quotes with varied combinations
    - Ensure coverage for different age ranges and vehicle types
*/

-- Clear existing sample data
TRUNCATE TABLE insurance_quotes;

-- Insert comprehensive sample data
INSERT INTO insurance_quotes (
  provider, monthly_premium, coverage_type, driver_age_range,
  vehicle_make, vehicle_model, vehicle_year, license_age, claims_count, city
) VALUES
  -- Toyota Camry Examples
  ('AllState', 150.00, 'Comprehensive', '25-34', 'Toyota', 'Camry', '2020', '16', '0', 'Toronto'),
  ('StateFarm', 165.00, 'Basic', '25-34', 'Toyota', 'Camry', '2020', '16', '0', 'Toronto'),
  ('Progressive', 175.00, 'Premium', '25-34', 'Toyota', 'Camry', '2020', '16', '0', 'Toronto'),
  ('Geico', 145.00, 'Basic', '25-34', 'Toyota', 'Camry', '2020', '16', '0', 'Toronto'),
  ('Liberty Mutual', 180.00, 'Premium', '25-34', 'Toyota', 'Camry', '2020', '16', '0', 'Toronto'),

  -- Honda Civic Examples
  ('AllState', 160.00, 'Comprehensive', '18-24', 'Honda', 'Civic', '2021', '16', '0', 'Vancouver'),
  ('StateFarm', 175.00, 'Basic', '18-24', 'Honda', 'Civic', '2021', '16', '0', 'Vancouver'),
  ('Progressive', 185.00, 'Premium', '18-24', 'Honda', 'Civic', '2021', '16', '0', 'Vancouver'),
  ('Geico', 155.00, 'Basic', '18-24', 'Honda', 'Civic', '2021', '16', '0', 'Vancouver'),
  ('Liberty Mutual', 190.00, 'Premium', '18-24', 'Honda', 'Civic', '2021', '16', '0', 'Vancouver'),

  -- Ford F-150 Examples
  ('AllState', 200.00, 'Comprehensive', '35-44', 'Ford', 'F-150', '2022', '17', '1', 'Calgary'),
  ('StateFarm', 215.00, 'Basic', '35-44', 'Ford', 'F-150', '2022', '17', '1', 'Calgary'),
  ('Progressive', 225.00, 'Premium', '35-44', 'Ford', 'F-150', '2022', '17', '1', 'Calgary'),
  ('Geico', 195.00, 'Basic', '35-44', 'Ford', 'F-150', '2022', '17', '1', 'Calgary'),
  ('Liberty Mutual', 230.00, 'Premium', '35-44', 'Ford', 'F-150', '2022', '17', '1', 'Calgary'),

  -- BMW 3 Series Examples
  ('AllState', 300.00, 'Comprehensive', '45-54', 'BMW', '3 Series', '2023', '18', '0', 'Montreal'),
  ('StateFarm', 315.00, 'Basic', '45-54', 'BMW', '3 Series', '2023', '18', '0', 'Montreal'),
  ('Progressive', 325.00, 'Premium', '45-54', 'BMW', '3 Series', '2023', '18', '0', 'Montreal'),
  ('Geico', 295.00, 'Basic', '45-54', 'BMW', '3 Series', '2023', '18', '0', 'Montreal'),
  ('Liberty Mutual', 330.00, 'Premium', '45-54', 'BMW', '3 Series', '2023', '18', '0', 'Montreal');