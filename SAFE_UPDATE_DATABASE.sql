-- 🚀 SAFE DATABASE UPDATE FOR EXISTING SUPABASE PROJECT
-- This script safely updates your existing database without recreating tables
-- Run this in your Supabase SQL Editor

-- ==========================================
-- 1. UTILITY FUNCTIONS (Safe to re-run)
-- ==========================================

-- Create update function for timestamps (safe to re-run)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- ==========================================

-- Add missing columns to profiles table if they don't exist
DO $$ 
BEGIN
    -- Add username column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') THEN
        ALTER TABLE profiles ADD COLUMN username TEXT;
        RAISE NOTICE 'Added username column to profiles table';
    END IF;
    
    -- Add full_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE profiles ADD COLUMN full_name TEXT;
        RAISE NOTICE 'Added full_name column to profiles table';
    END IF;
    
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to profiles table';
    END IF;
END $$;

-- Add missing columns to pages table if they don't exist
DO $$ 
BEGIN
    -- Add blocks column if it doesn't exist (for rich content)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pages' AND column_name = 'blocks') THEN
        ALTER TABLE pages ADD COLUMN blocks JSONB DEFAULT '[]';
        RAISE NOTICE 'Added blocks column to pages table';
    END IF;
    
    -- Add parent_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pages' AND column_name = 'parent_id') THEN
        ALTER TABLE pages ADD COLUMN parent_id TEXT REFERENCES pages(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added parent_id column to pages table';
    END IF;
    
    -- Add children column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pages' AND column_name = 'children') THEN
        ALTER TABLE pages ADD COLUMN children TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added children column to pages table';
    END IF;
    
    -- Add is_expanded column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pages' AND column_name = 'is_expanded') THEN
        ALTER TABLE pages ADD COLUMN is_expanded BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_expanded column to pages table';
    END IF;
END $$;

-- Add missing columns to daily_tasks table if they don't exist
DO $$ 
BEGIN
    -- Add streak column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_tasks' AND column_name = 'streak') THEN
        ALTER TABLE daily_tasks ADD COLUMN streak INTEGER DEFAULT 0;
        RAISE NOTICE 'Added streak column to daily_tasks table';
    END IF;
END $$;

-- ==========================================
-- 3. CREATE MISSING TABLES (Only if they don't exist)
-- ==========================================

-- Create health_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS health_settings (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  reminder_enabled BOOLEAN DEFAULT true,
  daily_checkin_time TIME DEFAULT '09:00:00',
  weekly_review_day INTEGER CHECK (weekly_review_day BETWEEN 0 AND 6) DEFAULT 0,
  notification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create calendar_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  is_all_day BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. ADD MISSING INDEXES (Safe to re-run)
-- ==========================================

-- Pages indexes (safe to re-run, will skip if exists)
CREATE INDEX IF NOT EXISTS idx_pages_user_id ON pages(user_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent_id ON pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_pages_created_at ON pages(created_at);

-- Daily tasks indexes
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_id ON daily_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_completed ON daily_tasks(completed);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_priority ON daily_tasks(priority);

-- Health protocols indexes
CREATE INDEX IF NOT EXISTS idx_health_protocols_user_id ON health_protocols(user_id);
CREATE INDEX IF NOT EXISTS idx_health_protocols_category ON health_protocols(category);

-- Quit habits indexes
CREATE INDEX IF NOT EXISTS idx_quit_habits_user_id ON quit_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_quit_habits_active ON quit_habits(is_active);
CREATE INDEX IF NOT EXISTS idx_quit_habits_quit_date ON quit_habits(quit_date);

-- Calendar events indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);

-- ==========================================
-- 5. ENABLE RLS ON ALL TABLES (Safe to re-run)
-- ==========================================

-- Enable RLS on all tables (safe to re-run)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE quit_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 6. CREATE OR UPDATE RLS POLICIES (Safe to re-run)
-- ==========================================

-- Drop existing policies if they exist and recreate them
-- This ensures we have the correct policies

-- PROFILES policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- PAGES policies
DROP POLICY IF EXISTS "Users can view own pages" ON pages;
DROP POLICY IF EXISTS "Users can insert own pages" ON pages;
DROP POLICY IF EXISTS "Users can update own pages" ON pages;
DROP POLICY IF EXISTS "Users can delete own pages" ON pages;

CREATE POLICY "Users can view own pages" ON pages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pages" ON pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pages" ON pages
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pages" ON pages
  FOR DELETE USING (auth.uid() = user_id);

-- DAILY_TASKS policies
DROP POLICY IF EXISTS "Users can view own daily tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Users can insert own daily tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Users can update own daily tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Users can delete own daily tasks" ON daily_tasks;

CREATE POLICY "Users can view own daily tasks" ON daily_tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily tasks" ON daily_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily tasks" ON daily_tasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own daily tasks" ON daily_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- FINANCE_DATA policies
DROP POLICY IF EXISTS "Users can view own finance data" ON finance_data;
DROP POLICY IF EXISTS "Users can insert own finance data" ON finance_data;
DROP POLICY IF EXISTS "Users can update own finance data" ON finance_data;
DROP POLICY IF EXISTS "Users can delete own finance data" ON finance_data;

CREATE POLICY "Users can view own finance data" ON finance_data
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance data" ON finance_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance data" ON finance_data
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance data" ON finance_data
  FOR DELETE USING (auth.uid() = user_id);

-- HEALTH_PROTOCOLS policies
DROP POLICY IF EXISTS "Users can view own health protocols" ON health_protocols;
DROP POLICY IF EXISTS "Users can insert own health protocols" ON health_protocols;
DROP POLICY IF EXISTS "Users can update own health protocols" ON health_protocols;
DROP POLICY IF EXISTS "Users can delete own health protocols" ON health_protocols;

CREATE POLICY "Users can view own health protocols" ON health_protocols
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health protocols" ON health_protocols
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health protocols" ON health_protocols
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own health protocols" ON health_protocols
  FOR DELETE USING (auth.uid() = user_id);

-- QUIT_HABITS policies
DROP POLICY IF EXISTS "Users can view own quit habits" ON quit_habits;
DROP POLICY IF EXISTS "Users can insert own quit habits" ON quit_habits;
DROP POLICY IF EXISTS "Users can update own quit habits" ON quit_habits;
DROP POLICY IF EXISTS "Users can delete own quit habits" ON quit_habits;

CREATE POLICY "Users can view own quit habits" ON quit_habits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quit habits" ON quit_habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quit habits" ON quit_habits
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quit habits" ON quit_habits
  FOR DELETE USING (auth.uid() = user_id);

-- HEALTH_SETTINGS policies
DROP POLICY IF EXISTS "Users can view own health settings" ON health_settings;
DROP POLICY IF EXISTS "Users can insert own health settings" ON health_settings;
DROP POLICY IF EXISTS "Users can update own health settings" ON health_settings;

CREATE POLICY "Users can view own health settings" ON health_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health settings" ON health_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health settings" ON health_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- CALENDAR_EVENTS policies
DROP POLICY IF EXISTS "Users can view own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can insert own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete own calendar events" ON calendar_events;

CREATE POLICY "Users can view own calendar events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calendar events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendar events" ON calendar_events
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendar events" ON calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 7. ADD MISSING TRIGGERS (Safe to re-run)
-- ==========================================

-- Drop existing triggers and recreate them (safe to re-run)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
DROP TRIGGER IF EXISTS update_daily_tasks_updated_at ON daily_tasks;
DROP TRIGGER IF EXISTS update_finance_data_updated_at ON finance_data;
DROP TRIGGER IF EXISTS update_health_protocols_updated_at ON health_protocols;
DROP TRIGGER IF EXISTS update_quit_habits_updated_at ON quit_habits;
DROP TRIGGER IF EXISTS update_health_settings_updated_at ON health_settings;
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;

-- Recreate triggers
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at 
  BEFORE UPDATE ON pages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_tasks_updated_at 
  BEFORE UPDATE ON daily_tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_data_updated_at 
  BEFORE UPDATE ON finance_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_protocols_updated_at 
  BEFORE UPDATE ON health_protocols 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quit_habits_updated_at 
  BEFORE UPDATE ON quit_habits 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_settings_updated_at 
  BEFORE UPDATE ON health_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at 
  BEFORE UPDATE ON calendar_events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 8. VERIFICATION & SUCCESS
-- ==========================================

-- Verify all tables exist
SELECT 'EXISTING TABLES:' as status;
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'pages', 'daily_tasks', 'finance_data', 'health_protocols', 'quit_habits', 'health_settings', 'calendar_events')
ORDER BY tablename;

-- Verify RLS is enabled
SELECT 'RLS STATUS:' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'pages', 'daily_tasks', 'finance_data', 'health_protocols', 'quit_habits', 'health_settings', 'calendar_events')
ORDER BY tablename;

-- Count policies
SELECT 'POLICIES ACTIVE:' as status;
SELECT COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public';

-- Final success message
SELECT '🎉 SAFE DATABASE UPDATE COMPLETE! 🎉' as result,
       'Your existing database has been safely updated with:' as info,
       '✅ All missing columns added' as feature1,
       '✅ Missing tables created' as feature2,
       '✅ RLS policies updated and secured' as feature3,
       '✅ Performance indexes added' as feature4,
       '✅ All triggers working' as feature5,
       '🚀 Ready for user signups!' as ready;
