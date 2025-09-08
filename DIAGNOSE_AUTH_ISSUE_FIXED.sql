-- 🔍 DIAGNOSE AUTH SIGNUP ISSUE (FIXED VERSION)
-- This script will help us understand why user signup is failing
-- Run this in your Supabase SQL Editor to diagnose the problem

-- ==========================================
-- 1. CHECK AUTH SCHEMA AND TABLES
-- ==========================================

-- Check if auth schema exists and has proper tables
SELECT 'AUTH SCHEMA CHECK:' as status;
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- Check auth.users table structure
SELECT 'AUTH.USERS TABLE STRUCTURE:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- ==========================================
-- 2. CHECK FOR CONFLICTING TRIGGERS
-- ==========================================

-- Check for any triggers on auth.users that might be failing
SELECT 'AUTH.USERS TRIGGERS:' as status;
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';

-- ==========================================
-- 3. CHECK PROFILES TABLE STRUCTURE
-- ==========================================

-- Check if profiles table exists and has correct structure
SELECT 'PROFILES TABLE CHECK:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if profiles table has proper foreign key to auth.users
SELECT 'PROFILES FOREIGN KEY CHECK:' as status;
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'profiles'
AND tc.table_schema = 'public';

-- ==========================================
-- 4. CHECK FOR ANY EXISTING AUTOMATIC TRIGGERS
-- ==========================================

-- Check for any functions that might be called on user creation
SELECT 'CUSTOM FUNCTIONS CHECK:' as status;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%user%' OR routine_name LIKE '%profile%')
ORDER BY routine_name;

-- Check for triggers on auth.users that might be failing
SELECT 'POTENTIAL PROBLEM TRIGGERS:' as status;
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_timing
FROM information_schema.triggers t
WHERE t.event_object_schema = 'auth' 
AND t.event_object_table = 'users';

-- ==========================================
-- 5. TEST BASIC AUTH FUNCTIONALITY
-- ==========================================

-- Check if we can query auth.users (should be empty for new project)
SELECT 'AUTH.USERS COUNT:' as status;
SELECT COUNT(*) as user_count FROM auth.users;

-- Check auth configuration
SELECT 'AUTH CONFIG:' as status;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users LIMIT 1) 
        THEN 'Auth table accessible with users' 
        ELSE 'Auth table empty but accessible' 
    END as auth_status;

-- ==========================================
-- 6. CHECK RLS ON AUTH TABLES
-- ==========================================

-- Check if RLS is enabled on auth tables (it shouldn't be)
SELECT 'AUTH TABLES RLS STATUS:' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- ==========================================
-- 7. CHECK FOR EXISTING PROFILES
-- ==========================================

-- Check if there are any existing profiles
SELECT 'PROFILES COUNT:' as status;
SELECT COUNT(*) as profile_count FROM profiles;

-- Check for orphaned profiles (profiles without auth users)
SELECT 'ORPHANED PROFILES CHECK:' as status;
SELECT COUNT(*) as orphaned_count 
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);

-- ==========================================
-- 8. FINAL DIAGNOSIS
-- ==========================================

SELECT '🔍 DIAGNOSIS COMPLETE' as result,
       'Check the results above for any issues:' as instruction,
       '1. Auth schema should exist with users table' as check1,
       '2. No problematic triggers on auth.users' as check2,
       '3. Profiles table should reference auth.users(id)' as check3,
       '4. No RLS enabled on auth tables' as check4,
       '5. Auth.users should be queryable' as check5;
