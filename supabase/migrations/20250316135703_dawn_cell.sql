/*
  # Add bank account form definition

  1. Changes
    - Add form definition for bank account category
    - Fields include:
      - Bank selection
      - Monthly fee
      - Free transactions

  2. Security
    - Uses existing RLS policies from category_forms table
*/

-- Insert bank account form definition
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
      "field_name": "bank",
      "field_type": "select",
      "field_label": "Which bank are you with?",
      "field_options": ["CIBC", "RBC", "National", "BMO", "TD", "Scotiabank"],
      "is_required": true,
      "display_order": 1
    },
    {
      "field_name": "monthly_fee",
      "field_type": "select",
      "field_label": "What is your monthly fee?",
      "field_options": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40"],
      "is_required": true,
      "display_order": 2
    },
    {
      "field_name": "free_transactions",
      "field_type": "select",
      "field_label": "How many free transactions per month do you have?",
      "field_options": ["0", "5", "10", "20", "unlimited"],
      "is_required": true,
      "display_order": 3
    }
  ]'::json) as x(
    field_name text,
    field_type text,
    field_label text,
    field_options jsonb,
    is_required boolean,
    display_order int
  )
WHERE pc.slug = 'bank-fees';