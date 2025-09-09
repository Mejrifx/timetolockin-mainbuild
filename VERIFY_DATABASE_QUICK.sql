-- 🔍 QUICK DATABASE VERIFICATION
-- Run this to quickly check if your database is properly set up

-- Check if core tables exist
SELECT 'CORE TABLES CHECK:' as status;
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
    THEN '✅ profiles' ELSE '❌ profiles MISSING' END as profiles,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pages')
    THEN '✅ pages' ELSE '❌ pages MISSING' END as pages,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_tasks')
    THEN '✅ daily_tasks' ELSE '❌ daily_tasks MISSING' END as daily_tasks,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'finance_data')
    THEN '✅ finance_data' ELSE '❌ finance_data MISSING' END as finance_data;

-- Test basic queries
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

-- Check RLS status
SELECT 'RLS STATUS:' as status;
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'pages', 'daily_tasks', 'finance_data')
ORDER BY tablename;

-- Final result
SELECT '🎯 VERIFICATION COMPLETE' as result,
  'If all tables show ✅ and queries work, your database is ready!' as instruction,
  'If any show ❌, run PERFECT_DATABASE_FINAL.sql' as fix;
