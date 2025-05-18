/*
  # Add Performance Indexes

  1. Changes
    - Add indexes for frequently queried columns
    - Add composite indexes for common query patterns
    - Add indexes for timestamp columns used in sorting

  2. Performance
    - Improves query performance for large datasets
    - Optimizes common search patterns
    - Enhances sorting operations
*/

-- Add index for category searches
CREATE INDEX IF NOT EXISTS idx_visitor_submissions_category 
ON visitor_submissions (category);

-- Add index for unclaimed submissions
CREATE INDEX IF NOT EXISTS idx_visitor_submissions_unclaimed 
ON visitor_submissions (category, claimed_by) 
WHERE claimed_by IS NULL;

-- Add index for created_at timestamp (for sorting)
CREATE INDEX IF NOT EXISTS idx_visitor_submissions_created_at 
ON visitor_submissions (created_at DESC);

-- Add index for user form responses category
CREATE INDEX IF NOT EXISTS idx_user_form_responses_category 
ON user_form_responses (category);

-- Add index for user form responses created_at
CREATE INDEX IF NOT EXISTS idx_user_form_responses_created_at 
ON user_form_responses (created_at DESC);

-- Add partial index for car insurance submissions
CREATE INDEX IF NOT EXISTS idx_car_insurance_submissions 
ON visitor_submissions (visitor_id, created_at) 
WHERE category = 'car-insurance';

-- Add index for visitor_id searches
CREATE INDEX IF NOT EXISTS idx_visitor_submissions_visitor_id 
ON visitor_submissions (visitor_id);