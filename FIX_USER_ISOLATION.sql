-- CRITICAL FIX: User Data Isolation - Run this in Supabase SQL Editor
-- This script ensures each user only sees their own data

-- First, let's check and fix Row Level Security for all tables

-- 1. ENABLE RLS on all tables (in case it's not enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Enable RLS on health tables (these were missing!)
ALTER TABLE health_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE quit_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_settings ENABLE ROW LEVEL SECURITY;

-- 2. DROP existing policies to recreate them properly
-- (This ensures clean policies without conflicts)

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

-- Drop finance_data policies
DROP POLICY IF EXISTS "Users can view own finance data" ON finance_data;
DROP POLICY IF EXISTS "Users can insert own finance data" ON finance_data;
DROP POLICY IF EXISTS "Users can update own finance data" ON finance_data;
DROP POLICY IF EXISTS "Users can delete own finance data" ON finance_data;

-- Drop health table policies (if they exist)
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

-- 3. CREATE PROPER RLS POLICIES

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

-- FINANCE_DATA table policies (THIS WAS THE ISSUE!)
CREATE POLICY "Users can view own finance data" ON finance_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own finance data" ON finance_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own finance data" ON finance_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own finance data" ON finance_data
  FOR DELETE USING (auth.uid() = user_id);

-- HEALTH_PROTOCOLS table policies (MISSING POLICIES!)
CREATE POLICY "Users can view own health protocols" ON health_protocols
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health protocols" ON health_protocols
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health protocols" ON health_protocols
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health protocols" ON health_protocols
  FOR DELETE USING (auth.uid() = user_id);

-- QUIT_HABITS table policies (THIS WAS THE MAIN ISSUE!)
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

-- CALENDAR_EVENTS table policies (for completeness)
CREATE POLICY "Users can view own calendar events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events" ON calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events" ON calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- 4. VERIFY RLS is working
-- You can run these queries to check if policies are active:

-- Check if RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'pages', 'daily_tasks', 'finance_data', 'health_protocols', 'quit_habits', 'health_settings');

-- Check all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- SUCCESS MESSAGE
SELECT 'RLS POLICIES UPDATED SUCCESSFULLY! Each user will now only see their own data.' as status;
