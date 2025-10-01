-- ==========================================
-- ADD NOTES FEATURE TO EXISTING DATABASE
-- ==========================================
-- This migration adds support for Note pages alongside Workspace pages
-- Run this in your Supabase SQL Editor if you already have the database set up

-- Add page_type column to pages table
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS page_type TEXT DEFAULT 'workspace';

-- Add constraint to ensure valid page types
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'pages_page_type_check'
    ) THEN
        ALTER TABLE pages 
        ADD CONSTRAINT pages_page_type_check 
        CHECK (page_type IN ('workspace', 'note'));
    END IF;
END $$;

-- Add note_metadata column to pages table
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS note_metadata JSONB DEFAULT NULL;

-- Update existing pages to have workspace type if NULL
UPDATE pages 
SET page_type = 'workspace' 
WHERE page_type IS NULL;

-- Create index for faster queries on page_type
CREATE INDEX IF NOT EXISTS idx_pages_page_type ON pages(page_type);
CREATE INDEX IF NOT EXISTS idx_pages_user_id_page_type ON pages(user_id, page_type);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns
WHERE table_name = 'pages' 
AND column_name IN ('page_type', 'note_metadata');
