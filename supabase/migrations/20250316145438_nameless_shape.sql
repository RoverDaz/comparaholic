/*
  # Add New Car Payment category and form fields

  1. New Tables
    - No new tables required, using existing schema

  2. Changes
    - Add "New Car Payment" category to product_categories
    - Add form fields for car payment questionnaire to category_forms

  3. Security
    - Inherits existing RLS policies from tables
*/

-- Insert New Car Payment category
INSERT INTO product_categories (name, slug, description)
VALUES (
  'New Car Payment',
  'new-car-payment',
  'Compare new car payment options including leasing and financing'
)
ON CONFLICT (slug) DO NOTHING;

-- Add form fields for New Car Payment
WITH category AS (
  SELECT id FROM product_categories WHERE slug = 'new-car-payment'
)
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
  category.id,
  field_name,
  field_type,
  field_label,
  field_options,
  is_required,
  display_order
FROM category, (
  VALUES
    (
      'make',
      'select',
      'What make of car are you interested in?',
      '["Toyota", "Honda", "Ford", "Chevrolet", "BMW", "Mercedes", "Hyundai", "Kia", "Volkswagen", "Audi"]'::jsonb,
      true,
      0
    ),
    (
      'model',
      'select',
      'Which model are you considering?',
      '[]'::jsonb,  -- This will be populated dynamically based on make selection
      true,
      1
    ),
    (
      'payment_type',
      'select',
      'How would you like to pay for your car?',
      '["Lease", "Finance"]'::jsonb,
      true,
      2
    ),
    (
      'interest_rate',
      'select',
      'What interest rate have you been offered?',
      (
        SELECT jsonb_agg(rate::text)
        FROM generate_series(1, 15, 0.5) rate
      ),
      true,
      3
    ),
    (
      'term',
      'select',
      'What is your preferred term length?',
      '["12 months", "24 months", "36 months", "48 months", "60 months", "72 months", "84 months"]'::jsonb,
      true,
      4
    ),
    (
      'down_payment',
      'select',
      'How much can you put as a down payment?',
      (
        SELECT jsonb_agg(amount::text)
        FROM generate_series(0, 20000, 1000) amount
      ),
      true,
      5
    )
) AS fields(
  field_name,
  field_type,
  field_label,
  field_options,
  is_required,
  display_order
)
ON CONFLICT (category_id, field_name) DO UPDATE
SET
  field_type = EXCLUDED.field_type,
  field_label = EXCLUDED.field_label,
  field_options = EXCLUDED.field_options,
  is_required = EXCLUDED.is_required,
  display_order = EXCLUDED.display_order;