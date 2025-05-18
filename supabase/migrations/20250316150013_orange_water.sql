/*
  # Update Car Payment Category

  1. Changes
    - Delete old "Car Payment" category
    - Update "New Car Payment" category questions

  2. New Questions
    - Make of car
    - Model of car
    - Monthly payment
    - Interest rate
    - Term length
    - Down payment amount
*/

-- Delete the old "Car Payment" category
DELETE FROM product_categories WHERE slug = 'car-payment';

-- Update New Car Payment category questions
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
      'What make is your car?',
      '["Toyota", "Honda", "Ford", "Chevrolet", "BMW", "Mercedes", "Hyundai", "Kia", "Volkswagen", "Audi"]'::jsonb,
      true,
      0
    ),
    (
      'model',
      'select',
      'What model is your car?',
      '[]'::jsonb,  -- This will be populated dynamically based on make selection
      true,
      1
    ),
    (
      'monthly_payment',
      'select',
      'How much is your monthly payment?',
      (
        SELECT jsonb_agg(amount::text)
        FROM generate_series(100, 2000, 50) amount
      ),
      true,
      2
    ),
    (
      'interest_rate',
      'select',
      'What is your interest rate?',
      (
        SELECT jsonb_agg(rate::text)
        FROM generate_series(0, 15, 0.5) rate
      ),
      true,
      3
    ),
    (
      'term',
      'select',
      'What is your loan term?',
      '["12 months", "24 months", "36 months", "48 months", "60 months", "72 months", "84 months"]'::jsonb,
      true,
      4
    ),
    (
      'down_payment',
      'select',
      'How much was your down payment?',
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