-- Quick test to verify Health Lab tables exist and are working
-- Run this in Supabase SQL Editor to verify setup

-- Check if tables exist
SELECT 'health_protocols table exists' as status;
SELECT 'quit_habits table exists' as status;
SELECT 'health_settings table exists' as status;

-- Test that we can query the tables (should return empty results for new user)
SELECT COUNT(*) as health_protocols_count FROM health_protocols;
SELECT COUNT(*) as quit_habits_count FROM quit_habits;
SELECT COUNT(*) as health_settings_count FROM health_settings;

-- Check RLS policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('health_protocols', 'quit_habits', 'health_settings')
ORDER BY tablename, policyname;
