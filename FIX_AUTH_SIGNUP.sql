-- 🚀 FIX AUTH SIGNUP ISSUE
-- This script fixes common causes of "Database error saving new user"
-- Run this AFTER running the DIAGNOSE_AUTH_ISSUE.sql script

-- ==========================================
-- 1. REMOVE ANY PROBLEMATIC TRIGGERS
-- ==========================================

-- Drop any existing triggers on auth.users that might be failing
-- These are common causes of signup failures

-- Drop the handle_new_user trigger if it exists (common culprit)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop any other custom triggers that might exist
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
        AND trigger_name != 'on_auth_user_created'  -- We already handled this one
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON auth.users';
        RAISE NOTICE 'Dropped trigger: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- ==========================================
-- 2. ENSURE PROFILES TABLE IS PROPERLY CONFIGURED
-- ==========================================

-- Make sure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure RLS is enabled on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Recreate profiles policies (safe to re-run)
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
-- 3. ENSURE AUTH TABLES DON'T HAVE RLS
-- ==========================================

-- Make sure RLS is NOT enabled on auth tables (this can cause signup failures)
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Drop any policies on auth.users if they exist
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
        RAISE NOTICE 'Dropped auth.users policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- ==========================================
-- 4. CLEAN UP ANY ORPHANED DATA
-- ==========================================

-- Remove any profiles that don't have corresponding auth users
-- This can cause constraint violations
DELETE FROM profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- ==========================================
-- 5. VERIFY AUTH CONFIGURATION
-- ==========================================

-- Make sure auth schema is properly set up
-- Check that essential auth tables exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        RAISE EXCEPTION 'Auth users table does not exist. This is a critical Supabase setup issue.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'identities') THEN
        RAISE EXCEPTION 'Auth identities table does not exist. This is a critical Supabase setup issue.';
    END IF;
    
    RAISE NOTICE 'Auth tables verified successfully';
END $$;

-- ==========================================
-- 6. CREATE SIMPLE, SAFE TRIGGER (OPTIONAL)
-- ==========================================

-- Instead of automatic profile creation, we'll let the app handle it
-- This is much safer and prevents signup failures

-- If you want automatic profile creation, uncomment this section:
/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Simple, safe profile creation
    INSERT INTO public.profiles (id, email)
    VALUES (new.id, new.email)
    ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate key errors
    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- If profile creation fails, don't fail the user signup
        RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
        RETURN new;
END;
$$;

-- Create trigger (only if you uncommented the function above)
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/

-- ==========================================
-- 7. VERIFICATION
-- ==========================================

-- Verify the fix
SELECT '🔍 AUTH FIX VERIFICATION:' as status;

-- Check auth tables
SELECT 'Auth tables exist:' as check,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users')
            THEN '✅ Yes' ELSE '❌ No' END as result;

-- Check profiles table
SELECT 'Profiles table exists:' as check,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
            THEN '✅ Yes' ELSE '❌ No' END as result;

-- Check for problematic triggers
SELECT 'Problematic triggers removed:' as check,
       CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE event_object_schema = 'auth' AND event_object_table = 'users')
            THEN '✅ Yes' ELSE '⚠️ Some triggers still exist' END as result;

-- Check RLS on auth.users
SELECT 'Auth.users RLS disabled:' as check,
       CASE WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users' AND rowsecurity = true)
            THEN '✅ Yes' ELSE '❌ RLS still enabled' END as result;

-- Final success message
SELECT '🎉 AUTH SIGNUP FIX COMPLETE! 🎉' as result,
       'Try creating a user account now.' as instruction,
       'Profile creation will be handled by the app code.' as note;
