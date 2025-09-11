-- Fix calendar_events table schema
-- This script adds the missing event_time column and ensures the table structure is correct

-- First, check if the table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add the event_time column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        AND column_name = 'event_time'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE calendar_events ADD COLUMN event_time TIME;
    END IF;
END $$;

-- Ensure all other columns exist
DO $$ 
BEGIN
    -- Add event_date if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        AND column_name = 'event_date'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE calendar_events ADD COLUMN event_date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    -- Add description if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        AND column_name = 'description'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE calendar_events ADD COLUMN description TEXT;
    END IF;
    
    -- Add created_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE calendar_events ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE calendar_events ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can insert own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete own calendar events" ON calendar_events;

-- Create RLS policies
CREATE POLICY "Users can view own calendar events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events" ON calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events" ON calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- Create or replace the updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;

-- Create the trigger
CREATE TRIGGER update_calendar_events_updated_at 
  BEFORE UPDATE ON calendar_events 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'calendar_events' 
AND table_schema = 'public'
ORDER BY ordinal_position;
