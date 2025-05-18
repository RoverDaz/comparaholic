/*
  # Fix Insurance Data

  1. Changes
    - Clear and repopulate insurance quotes table with proper sample data
    - Ensure all numeric values are properly formatted
    - Add comprehensive coverage options and realistic premiums
*/

-- Clear existing data
TRUNCATE TABLE insurance_quotes;

-- Insert comprehensive sample data with realistic premiums
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

  -- Additional age groups and vehicles
  ('AllState', 190.00, 'Comprehensive', '55-64', 'Mercedes', 'C-Class', '2022', '18', '0', 'Ottawa'),
  ('Progressive', 185.00, 'Premium', '55-64', 'Chevrolet', 'Malibu', '2021', '17', '0', 'Edmonton'),
  ('Geico', 170.00, 'Basic', '65+', 'Toyota', 'RAV4', '2020', '16', '0', 'Toronto'),
  ('StateFarm', 200.00, 'Premium', '65+', 'Honda', 'CR-V', '2023', '16', '0', 'Vancouver');