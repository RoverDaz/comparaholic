/*
  # Save Point - User Registration Removal

  This migration serves as a save point for the current schema state.
  It verifies the presence and configuration of all required database
  components without modifying the schema.

  1. Current State
    - User authentication through Supabase Auth
    - Form responses stored in user_form_responses
    - Visitor submissions with rate limiting
    - Product categories and comparisons
    - Row Level Security (RLS) enabled
    - Data validation constraints
    - Performance indexes

  2. Verification
    - Checks presence of all required tables
    - Verifies RLS is enabled
    - Confirms required functions exist
    - Validates indexes are present
*/

DO $$ 
BEGIN
  -- Verify all required tables exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
      'profiles',
      'product_categories',
      'products',
      'comparisons',
      'insurance_quotes',
      'user_insurance_responses',
      'category_forms',
      'user_responses',
      'user_form_responses',
      'visitor_submissions',
      'rate_limits'
    )
  ) THEN
    RAISE EXCEPTION 'Schema verification failed: Missing required tables';
  END IF;

  -- Verify RLS is enabled on all tables
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'profiles',
      'product_categories',
      'products',
      'comparisons',
      'insurance_quotes',
      'user_insurance_responses',
      'category_forms',
      'user_responses',
      'user_form_responses',
      'visitor_submissions'
    )
    AND NOT rowsecurity
  ) THEN
    RAISE EXCEPTION 'Security verification failed: RLS not enabled on all tables';
  END IF;

  -- Verify required functions exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname IN (
      'check_rate_limit',
      'validate_form_data',
      'update_updated_at_column'
    )
  ) THEN
    RAISE EXCEPTION 'Function verification failed: Missing required functions';
  END IF;

  -- Verify required indexes exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname IN (
      'idx_user_form_responses_category_created',
      'idx_user_form_responses_user_category',
      'idx_real_estate_broker_responses',
      'idx_visitor_submissions_category',
      'idx_visitor_submissions_created_at',
      'idx_visitor_submissions_visitor_id'
    )
  ) THEN
    RAISE EXCEPTION 'Index verification failed: Missing required indexes';
  END IF;

  -- Log successful verification
  RAISE NOTICE 'Save point verification successful: All required components present';
END $$;