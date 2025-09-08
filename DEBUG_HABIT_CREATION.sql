-- DEBUG HABIT CREATION ISSUES
-- Run this to see what's happening when habits aren't saving

-- 1. Check if user profiles exist
SELECT 'USER PROFILES:' as info;
SELECT id, email, created_at 
FROM profiles
ORDER BY created_at DESC;

-- 2. Check if there are any quit habits in the database
SELECT 'QUIT HABITS IN DATABASE:' as info;
SELECT id, user_id, name, created_at 
FROM quit_habits
ORDER BY created_at DESC;

-- 3. Check if RLS is enabled on quit_habits
SELECT 'RLS STATUS FOR QUIT_HABITS:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'quit_habits';

-- 4. Check quit_habits policies
SELECT 'QUIT_HABITS POLICIES:' as info;
SELECT policyname, cmd, permissive, qual
FROM pg_policies 
WHERE tablename = 'quit_habits';

-- 5. Test inserting a habit manually (replace USER_ID with actual user ID)
-- First, get the current user ID from profiles table
SELECT 'CURRENT USERS (copy one of these IDs):' as info;
SELECT id as user_id_to_copy, email
FROM profiles;

-- Uncomment and replace YOUR_USER_ID_HERE with actual ID from above query:
-- INSERT INTO quit_habits (
--   id, 
--   user_id, 
--   name, 
--   description, 
--   quit_date, 
--   category
-- ) VALUES (
--   'test-habit-123',
--   'YOUR_USER_ID_HERE',
--   'Test Habit',
--   'Testing habit creation',
--   NOW(),
--   'other'
-- );

SELECT 'DEBUG COMPLETE - Check results above!' as result;
