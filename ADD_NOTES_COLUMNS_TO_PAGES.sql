-- ==========================================
-- ADD NOTES FEATURE COLUMNS TO PAGES TABLE
-- ==========================================
-- This script safely adds note functionality to existing pages table
-- Run this in your Supabase SQL Editor
-- Safe to run multiple times (will skip if columns already exist)

-- Step 1: Add page_type column if it doesn't exist
DO $$ 
BEGIN
    -- Check if page_type column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pages' 
        AND column_name = 'page_type'
    ) THEN
        -- Add the column
        ALTER TABLE pages 
        ADD COLUMN page_type TEXT DEFAULT 'workspace';
        
        RAISE NOTICE 'Added page_type column to pages table';
    ELSE
        RAISE NOTICE 'page_type column already exists';
    END IF;
END $$;

-- Step 2: Add constraint for page_type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'pages_page_type_check'
    ) THEN
        ALTER TABLE pages 
        ADD CONSTRAINT pages_page_type_check 
        CHECK (page_type IN ('workspace', 'note'));
        
        RAISE NOTICE 'Added page_type constraint';
    ELSE
        RAISE NOTICE 'page_type constraint already exists';
    END IF;
END $$;

-- Step 3: Add note_metadata column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pages' 
        AND column_name = 'note_metadata'
    ) THEN
        ALTER TABLE pages 
        ADD COLUMN note_metadata JSONB DEFAULT NULL;
        
        RAISE NOTICE 'Added note_metadata column to pages table';
    ELSE
        RAISE NOTICE 'note_metadata column already exists';
    END IF;
END $$;

-- Step 4: Update existing pages to have workspace type if NULL
DO $$ 
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE pages 
    SET page_type = 'workspace' 
    WHERE page_type IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % existing pages to workspace type', updated_count;
END $$;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pages_page_type 
ON pages(page_type);

CREATE INDEX IF NOT EXISTS idx_pages_user_id_page_type 
ON pages(user_id, page_type);

-- Notify that indexes were created
DO $$ 
BEGIN
    RAISE NOTICE 'Created performance indexes';
END $$;

-- Step 6: Verify the changes
DO $$
DECLARE
    page_type_exists BOOLEAN;
    note_metadata_exists BOOLEAN;
BEGIN
    -- Check if columns exist
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pages' 
        AND column_name = 'page_type'
    ) INTO page_type_exists;
    
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pages' 
        AND column_name = 'note_metadata'
    ) INTO note_metadata_exists;
    
    -- Report status
    IF page_type_exists AND note_metadata_exists THEN
        RAISE NOTICE '✅ SUCCESS! Notes feature columns added successfully';
        RAISE NOTICE 'page_type column: EXISTS';
        RAISE NOTICE 'note_metadata column: EXISTS';
        RAISE NOTICE 'You can now create note pages in your app!';
    ELSE
        RAISE WARNING '❌ FAILED! Some columns were not added';
        IF NOT page_type_exists THEN
            RAISE WARNING 'page_type column: MISSING';
        END IF;
        IF NOT note_metadata_exists THEN
            RAISE WARNING 'note_metadata column: MISSING';
        END IF;
    END IF;
END $$;

-- Step 7: Show the updated table structure
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'pages'
AND column_name IN ('page_type', 'note_metadata')
ORDER BY ordinal_position;

