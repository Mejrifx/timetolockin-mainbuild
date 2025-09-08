-- 🔍 SIMPLE AUTH DIAGNOSIS
-- Run this to get clear diagnostic information

-- Check 1: Do auth tables exist?
SELECT 'CHECK 1 - AUTH TABLES:' as test;
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users')
    THEN '✅ auth.users exists'
    ELSE '❌ auth.users MISSING - Critical Error!'
  END as auth_users_status;

-- Check 2: Any triggers on auth.users?
SELECT 'CHECK 2 - AUTH TRIGGERS:' as test;
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE event_object_schema = 'auth' AND event_object_table = 'users')
    THEN '⚠️ TRIGGERS FOUND on auth.users - This could be the problem!'
    ELSE '✅ No triggers on auth.users'
  END as trigger_status;

-- Check 3: Show any triggers that exist
SELECT 'CHECK 3 - TRIGGER DETAILS:' as test;
SELECT trigger_name, action_timing, event_manipulation
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' AND event_object_table = 'users';

-- Check 4: Does profiles table exist?
SELECT 'CHECK 4 - PROFILES TABLE:' as test;
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
    THEN '✅ profiles table exists'
    ELSE '❌ profiles table missing'
  END as profiles_status;

-- Check 5: Is RLS enabled on auth.users? (Should be NO)
SELECT 'CHECK 5 - AUTH RLS STATUS:' as test;
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users' AND rowsecurity = true)
    THEN '❌ RLS ENABLED on auth.users - This causes signup failures!'
    ELSE '✅ RLS disabled on auth.users'
  END as auth_rls_status;

-- Check 6: Can we access auth.users?
SELECT 'CHECK 6 - AUTH ACCESS:' as test;
SELECT COUNT(*) as current_user_count FROM auth.users;

-- Check 7: Any custom functions that might be causing issues?
SELECT 'CHECK 7 - CUSTOM FUNCTIONS:' as test;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%user%' OR routine_name LIKE '%profile%')
LIMIT 5;

-- FINAL RESULT
SELECT '🎯 KEY FINDINGS:' as summary,
  'Look above for any ❌ or ⚠️ items - these are likely causing the signup failure' as instruction;
