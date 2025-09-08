-- SAFE USER ISOLATION FIX - Handles existing policies properly
-- Run this in Supabase SQL Editor

-- 1. ENABLE RLS on all tables (safe to run multiple times)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Enable RLS on health tables (these were missing!)
ALTER TABLE health_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE quit_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_settings ENABLE ROW LEVEL SECURITY;

-- 2. DROP ALL existing policies first (safe approach)
-- This ensures we start with a clean slate

-- Drop profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Drop pages policies  
DROP POLICY IF EXISTS "Users can view own pages" ON pages;
DROP POLICY IF EXISTS "Users can insert own pages" ON pages;
DROP POLICY IF EXISTS "Users can update own pages" ON pages;
DROP POLICY IF EXISTS "Users can delete own pages" ON pages;

-- Drop daily_tasks policies
DROP POLICY IF EXISTS "Users can view own daily tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Users can insert own daily tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Users can update own daily tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Users can delete own daily tasks" ON daily_tasks;

-- Drop finance_data policies (CRITICAL FOR FINANCE ISOLATION)
DROP POLICY IF EXISTS "Users can view own finance data" ON finance_data;
DROP POLICY IF EXISTS "Users can insert own finance data" ON finance_data;
DROP POLICY IF EXISTS "Users can update own finance data" ON finance_data;
DROP POLICY IF EXISTS "Users can delete own finance data" ON finance_data;

-- Drop calendar_events policies
DROP POLICY IF EXISTS "Users can view own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can insert own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete own calendar events" ON calendar_events;

-- Drop health table policies (CRITICAL FOR HABITS ISOLATION)
DROP POLICY IF EXISTS "Users can view own health protocols" ON health_protocols;
DROP POLICY IF EXISTS "Users can insert own health protocols" ON health_protocols;
DROP POLICY IF EXISTS "Users can update own health protocols" ON health_protocols;
DROP POLICY IF EXISTS "Users can delete own health protocols" ON health_protocols;

DROP POLICY IF EXISTS "Users can view own quit habits" ON quit_habits;
DROP POLICY IF EXISTS "Users can insert own quit habits" ON quit_habits;
DROP POLICY IF EXISTS "Users can update own quit habits" ON quit_habits;
DROP POLICY IF EXISTS "Users can delete own quit habits" ON quit_habits;

DROP POLICY IF EXISTS "Users can view own health settings" ON health_settings;
DROP POLICY IF EXISTS "Users can insert own health settings" ON health_settings;
DROP POLICY IF EXISTS "Users can update own health settings" ON health_settings;

-- 3. CREATE ALL POLICIES FROM SCRATCH

-- PROFILES table policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- PAGES table policies
CREATE POLICY "Users can view own pages" ON pages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pages" ON pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pages" ON pages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pages" ON pages
  FOR DELETE USING (auth.uid() = user_id);

-- DAILY_TASKS table policies
CREATE POLICY "Users can view own daily tasks" ON daily_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily tasks" ON daily_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily tasks" ON daily_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily tasks" ON daily_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- FINANCE_DATA table policies (CRITICAL - THIS FIXES SHARED BALANCES!)
CREATE POLICY "Users can view own finance data" ON finance_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own finance data" ON finance_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own finance data" ON finance_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own finance data" ON finance_data
  FOR DELETE USING (auth.uid() = user_id);

-- CALENDAR_EVENTS table policies
CREATE POLICY "Users can view own calendar events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events" ON calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events" ON calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- HEALTH_PROTOCOLS table policies
CREATE POLICY "Users can view own health protocols" ON health_protocols
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health protocols" ON health_protocols
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health protocols" ON health_protocols
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health protocols" ON health_protocols
  FOR DELETE USING (auth.uid() = user_id);

-- QUIT_HABITS table policies (CRITICAL - THIS FIXES SHARED HABITS!)
CREATE POLICY "Users can view own quit habits" ON quit_habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quit habits" ON quit_habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quit habits" ON quit_habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quit habits" ON quit_habits
  FOR DELETE USING (auth.uid() = user_id);

-- HEALTH_SETTINGS table policies
CREATE POLICY "Users can view own health settings" ON health_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health settings" ON health_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health settings" ON health_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. VERIFICATION QUERIES (Optional - you can run these to check)
-- Uncomment these lines if you want to verify the setup:

-- SELECT 'RLS STATUS CHECK:' as info;
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('profiles', 'pages', 'daily_tasks', 'finance_data', 'health_protocols', 'quit_habits', 'health_settings', 'calendar_events');

-- SELECT 'POLICIES CHECK:' as info;
-- SELECT tablename, policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- Final success message
SELECT '✅ USER ISOLATION FIXED! Finance and habits are now properly isolated per user.' as result;
