-- 🔍 COMPREHENSIVE USER ISOLATION VERIFICATION
-- Run this to verify that user data is properly isolated

-- Check if RLS is enabled on all tables
SELECT 'RLS STATUS CHECK:' as status;
SELECT 
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'pages', 'daily_tasks', 'finance_data', 'health_protocols', 'quit_habits')
ORDER BY tablename;

-- Check RLS policies
SELECT 'RLS POLICIES CHECK:' as status;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'pages', 'daily_tasks', 'finance_data', 'health_protocols', 'quit_habits')
ORDER BY tablename, policyname;

-- Test data isolation by checking if we can see data from different users
SELECT 'DATA ISOLATION TEST:' as status;

-- Check if we can see all users' data (this should be restricted by RLS)
SELECT 'All profiles (should be restricted by RLS):' as test;
SELECT id, email, username FROM profiles LIMIT 5;

-- Check if we can see all pages (should be restricted by RLS)
SELECT 'All pages (should be restricted by RLS):' as test;
SELECT id, user_id, title FROM pages LIMIT 5;

-- Check if we can see all daily tasks (should be restricted by RLS)
SELECT 'All daily tasks (should be restricted by RLS):' as test;
SELECT id, user_id, title FROM daily_tasks LIMIT 5;

-- Check if we can see all finance data (should be restricted by RLS)
SELECT 'All finance data (should be restricted by RLS):' as test;
SELECT id, user_id FROM finance_data LIMIT 5;

-- Check if we can see all health protocols (should be restricted by RLS)
SELECT 'All health protocols (should be restricted by RLS):' as test;
SELECT id, user_id, name FROM health_protocols LIMIT 5;

-- Check if we can see all quit habits (should be restricted by RLS)
SELECT 'All quit habits (should be restricted by RLS):' as test;
SELECT id, user_id, name FROM quit_habits LIMIT 5;

-- Check current user context
SELECT 'CURRENT USER CONTEXT:' as status;
SELECT auth.uid() as current_user_id;

-- Check if auth.users table exists and is accessible
SELECT 'AUTH USERS TABLE CHECK:' as status;
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users')
    THEN '✅ auth.users table exists' 
    ELSE '❌ auth.users table missing' 
  END as auth_users_status;

-- Check if we can query auth.users (this should work)
SELECT 'Auth users query test:' as test;
SELECT id, email FROM auth.users LIMIT 3;

-- Final verification
SELECT '🎯 VERIFICATION COMPLETE' as result,
  'If RLS is enabled and policies exist, user data should be isolated' as instruction,
  'If you can see all users data above, RLS is not working properly' as warning;
