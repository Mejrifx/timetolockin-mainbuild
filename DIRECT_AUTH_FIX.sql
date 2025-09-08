-- 🚀 DIRECT AUTH FIX
-- This fixes the most common causes of "Database error saving new user"
-- Run this script to fix auth signup issues

-- ==========================================
-- FIX 1: REMOVE ALL TRIGGERS FROM AUTH.USERS
-- ==========================================

-- This is the #1 cause of signup failures
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Drop all triggers on auth.users
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON auth.users CASCADE';
        RAISE NOTICE 'Removed trigger: %', trigger_record.trigger_name;
    END LOOP;
    
    -- Also drop common trigger functions that cause problems
    DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
    DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
    
    RAISE NOTICE 'All auth triggers and functions removed';
END $$;

-- ==========================================
-- FIX 2: DISABLE RLS ON AUTH TABLES
-- ==========================================

-- RLS on auth tables causes 500 errors
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Remove any policies on auth.users
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'auth' 
        AND tablename = 'users'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON auth.users';
        RAISE NOTICE 'Removed auth policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- ==========================================
-- FIX 3: ENSURE PROFILES TABLE IS CORRECT
-- ==========================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles (this is correct)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create safe profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ==========================================
-- FIX 4: CLEAN UP ORPHANED DATA
-- ==========================================

-- Remove any profiles without corresponding auth users
DELETE FROM profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- ==========================================
-- VERIFICATION
-- ==========================================

-- Verify the fixes
SELECT '🎉 AUTH FIX APPLIED!' as status;

SELECT 'Triggers on auth.users:' as check,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE event_object_schema = 'auth' AND event_object_table = 'users')
    THEN '⚠️ Still has triggers'
    ELSE '✅ All triggers removed'
  END as result;

SELECT 'RLS on auth.users:' as check,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users' AND rowsecurity = true)
    THEN '❌ RLS still enabled'
    ELSE '✅ RLS disabled'
  END as result;

SELECT 'Profiles table:' as check,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
    THEN '✅ Exists and ready'
    ELSE '❌ Missing'
  END as result;

SELECT '🚀 TRY SIGNUP NOW!' as instruction,
       'The most common auth issues have been fixed.' as note;
