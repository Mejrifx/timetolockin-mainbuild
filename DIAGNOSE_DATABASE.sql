-- DIAGNOSE DATABASE ISSUES
-- Run this to understand what's happening with user data

-- 1. Check if RLS is actually enabled
SELECT 'RLS STATUS:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'pages', 'daily_tasks', 'finance_data', 'health_protocols', 'quit_habits', 'health_settings');

-- 2. Check current policies
SELECT 'CURRENT POLICIES:' as info;
SELECT tablename, policyname, cmd, permissive
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Check finance_data table contents (THIS IS THE PROBLEM!)
SELECT 'FINANCE DATA CONTENTS:' as info;
SELECT user_id, 
       CASE 
         WHEN user_id IS NULL THEN '❌ NULL USER_ID (PROBLEM!)'
         ELSE '✅ Has user_id'
       END as status,
       created_at
FROM finance_data;

-- 4. Check quit_habits table contents
SELECT 'QUIT HABITS CONTENTS:' as info;
SELECT user_id,
       name,
       CASE 
         WHEN user_id IS NULL THEN '❌ NULL USER_ID (PROBLEM!)'
         ELSE '✅ Has user_id'
       END as status,
       created_at
FROM quit_habits;

-- 5. Check health_protocols table contents
SELECT 'HEALTH PROTOCOLS CONTENTS:' as info;
SELECT user_id,
       title,
       CASE 
         WHEN user_id IS NULL THEN '❌ NULL USER_ID (PROBLEM!)'
         ELSE '✅ Has user_id'
       END as status,
       created_at
FROM health_protocols;

-- 6. Check pages table contents
SELECT 'PAGES CONTENTS:' as info;
SELECT user_id,
       title,
       CASE 
         WHEN user_id IS NULL THEN '❌ NULL USER_ID (PROBLEM!)'
         ELSE '✅ Has user_id'
       END as status,
       created_at
FROM pages;

-- 7. Check daily_tasks table contents
SELECT 'DAILY TASKS CONTENTS:' as info;
SELECT user_id,
       title,
       CASE 
         WHEN user_id IS NULL THEN '❌ NULL USER_ID (PROBLEM!)'
         ELSE '✅ Has user_id'
       END as status,
       created_at
FROM daily_tasks;

-- 8. Check profiles table
SELECT 'PROFILES:' as info;
SELECT id, email, created_at
FROM profiles;

SELECT 'DIAGNOSIS COMPLETE - Check results above!' as result;
