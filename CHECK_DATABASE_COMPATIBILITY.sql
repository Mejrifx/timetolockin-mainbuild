-- 🔍 CHECK DATABASE COMPATIBILITY
-- Run this to verify your database has the correct tables for the app

-- Check if all required tables exist
SELECT 'REQUIRED TABLES CHECK:' as status;
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
    THEN '✅ profiles' ELSE '❌ profiles MISSING' END as profiles_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pages')
    THEN '✅ pages' ELSE '❌ pages MISSING' END as pages_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_tasks')
    THEN '✅ daily_tasks' ELSE '❌ daily_tasks MISSING' END as daily_tasks_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'finance_data')
    THEN '✅ finance_data' ELSE '❌ finance_data MISSING' END as finance_data_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'health_protocols')
    THEN '✅ health_protocols' ELSE '❌ health_protocols MISSING' END as health_protocols_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quit_habits')
    THEN '✅ quit_habits' ELSE '❌ quit_habits MISSING' END as quit_habits_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'health_settings')
    THEN '✅ health_settings' ELSE '❌ health_settings MISSING' END as health_settings_status;

-- Check RLS status
SELECT 'RLS STATUS CHECK:' as status;
SELECT 
  schemaname, 
  tablename, 
  CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'pages', 'daily_tasks', 'finance_data', 'health_protocols', 'quit_habits', 'health_settings')
ORDER BY tablename;

-- Check if policies exist
SELECT 'POLICIES CHECK:' as status;
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'pages', 'daily_tasks', 'finance_data', 'health_protocols', 'quit_habits', 'health_settings')
GROUP BY tablename
ORDER BY tablename;

-- Test basic queries (should not fail)
SELECT 'QUERY TESTS:' as status;

-- Test profiles query
SELECT 'Profiles query:' as test,
  CASE WHEN EXISTS (SELECT 1 FROM profiles LIMIT 1) 
    THEN '✅ Works' 
    ELSE '⚠️ Empty but accessible' 
  END as result;

-- Test pages query  
SELECT 'Pages query:' as test,
  CASE WHEN EXISTS (SELECT 1 FROM pages LIMIT 1) 
    THEN '✅ Works' 
    ELSE '⚠️ Empty but accessible' 
  END as result;

-- Test daily_tasks query
SELECT 'Daily tasks query:' as test,
  CASE WHEN EXISTS (SELECT 1 FROM daily_tasks LIMIT 1) 
    THEN '✅ Works' 
    ELSE '⚠️ Empty but accessible' 
  END as result;

-- Test finance_data query
SELECT 'Finance data query:' as test,
  CASE WHEN EXISTS (SELECT 1 FROM finance_data LIMIT 1) 
    THEN '✅ Works' 
    ELSE '⚠️ Empty but accessible' 
  END as result;

-- Test health_protocols query
SELECT 'Health protocols query:' as test,
  CASE WHEN EXISTS (SELECT 1 FROM health_protocols LIMIT 1) 
    THEN '✅ Works' 
    ELSE '⚠️ Empty but accessible' 
  END as result;

-- Test quit_habits query
SELECT 'Quit habits query:' as test,
  CASE WHEN EXISTS (SELECT 1 FROM quit_habits LIMIT 1) 
    THEN '✅ Works' 
    ELSE '⚠️ Empty but accessible' 
  END as result;

-- Test health_settings query
SELECT 'Health settings query:' as test,
  CASE WHEN EXISTS (SELECT 1 FROM health_settings LIMIT 1) 
    THEN '✅ Works' 
    ELSE '⚠️ Empty but accessible' 
  END as result;

-- Final summary
SELECT '🎯 COMPATIBILITY SUMMARY:' as result,
  'If all tables show ✅ and queries work, your database is ready!' as instruction,
  'If any show ❌, you need to run the PERFECT_DATABASE_FINAL.sql script' as fix;
