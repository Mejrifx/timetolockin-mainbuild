-- FIX PROFILE AND HABITS CREATION AFTER RESET
-- This ensures user profiles exist and habits can be created

-- 1. First, let's see what users exist in auth.users but not in profiles
SELECT 'USERS WITHOUT PROFILES:' as info;
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 2. Create profiles for any users that don't have them
-- This will create profiles for all authenticated users
INSERT INTO profiles (id, email, username, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3. Verify profiles were created
SELECT 'PROFILES AFTER CREATION:' as info;
SELECT id, email, username, created_at 
FROM profiles
ORDER BY created_at DESC;

-- 4. Test RLS policies by attempting to view data as different users
-- This will help us see if RLS is working correctly

-- 5. Make sure quit_habits table structure is correct
SELECT 'QUIT_HABITS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'quit_habits' 
ORDER BY ordinal_position;

-- 6. Check if there are any constraints that might be failing
SELECT 'QUIT_HABITS CONSTRAINTS:' as info;
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'quit_habits'::regclass;

-- 7. Test habit creation with a manual insert (this will help debug)
-- Replace 'YOUR_EMAIL_HERE' with your actual email
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get user ID for your email (replace with your actual email)
    SELECT id INTO user_uuid 
    FROM profiles 
    WHERE email = 'mejrifx@gmail.com'  -- CHANGE THIS TO YOUR EMAIL
    LIMIT 1;
    
    IF user_uuid IS NOT NULL THEN
        -- Try to insert a test habit
        INSERT INTO quit_habits (
            id, 
            user_id, 
            name, 
            description, 
            quit_date, 
            category,
            is_active
        ) VALUES (
            'test-habit-' || extract(epoch from now()),
            user_uuid,
            'Test Habit - Manual Creation',
            'This is a test habit created manually to debug the issue',
            NOW(),
            'other',
            true
        );
        
        RAISE NOTICE 'Test habit created successfully for user: %', user_uuid;
    ELSE
        RAISE NOTICE 'No user found with that email. Update the email in the script.';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating test habit: %', SQLERRM;
END $$;

-- 8. Show any habits that were created
SELECT 'HABITS AFTER TEST CREATION:' as info;
SELECT id, user_id, name, created_at 
FROM quit_habits
ORDER BY created_at DESC;

SELECT '✅ PROFILE AND HABIT DEBUGGING COMPLETE!' as result;
