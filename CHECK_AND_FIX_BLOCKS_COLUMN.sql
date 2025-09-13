-- Safe script to check and fix blocks column in pages table
-- This script only adds the column if it doesn't exist - no destructive operations

-- First, let's check the current structure of the pages table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'pages' 
ORDER BY ordinal_position;

-- Add blocks column if it doesn't exist (safe operation)
DO $$ 
BEGIN
  -- Check if blocks column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'pages' 
    AND column_name = 'blocks'
  ) THEN
    -- Add the blocks column
    ALTER TABLE pages ADD COLUMN blocks JSONB DEFAULT '[]';
    RAISE NOTICE 'Added blocks column to pages table';
  ELSE
    RAISE NOTICE 'blocks column already exists in pages table';
  END IF;
END $$;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'pages' 
ORDER BY ordinal_position;

-- Test query to see if we can read blocks data
SELECT 
  id, 
  title, 
  blocks,
  CASE 
    WHEN blocks IS NULL THEN 'NULL'
    WHEN jsonb_typeof(blocks) = 'array' THEN 'ARRAY with ' || jsonb_array_length(blocks) || ' items'
    ELSE 'OTHER: ' || jsonb_typeof(blocks)
  END as blocks_status
FROM pages 
LIMIT 5;
