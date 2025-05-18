-- Clear all visitor submissions
TRUNCATE TABLE visitor_submissions;

-- Reset any sequences if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.sequences 
    WHERE sequence_schema = 'public' 
    AND sequence_name = 'visitor_submissions_id_seq'
  ) THEN
    ALTER SEQUENCE visitor_submissions_id_seq RESTART;
  END IF;
END $$;

-- Verify the table is empty but still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM visitor_submissions
  ) THEN
    RAISE EXCEPTION 'Failed to clear visitor submissions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'visitor_submissions'
  ) THEN
    RAISE EXCEPTION 'visitor_submissions table is missing';
  END IF;
END $$;