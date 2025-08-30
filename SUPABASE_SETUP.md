# Supabase Database Setup for GM AI

## Step 1: Run SQL Script in Supabase Dashboard

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your GM AI project  
3. Navigate to **SQL Editor** (in left sidebar)
4. Click **"New Query"**
5. Copy and paste the following SQL script:

```sql
-- GM AI Database Schema
-- Run this in your Supabase SQL editor to set up the database tables

-- Enable Row Level Security (RLS) for all tables
-- This ensures users can only access their own data

-- 1. Create profiles table (for user information)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create pages table (replaces localStorage pages)
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  icon TEXT DEFAULT 'document',
  parent_id TEXT REFERENCES pages(id) ON DELETE CASCADE,
  children TEXT[] DEFAULT '{}',
  is_expanded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create daily_tasks table (replaces localStorage daily tasks)
CREATE TABLE IF NOT EXISTS daily_tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  time_allocation INTEGER NOT NULL DEFAULT 30,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL DEFAULT 'Personal',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create finance_data table (for financial tracking)
CREATE TABLE IF NOT EXISTS finance_data (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for pages
CREATE POLICY "Users can view own pages" ON pages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pages" ON pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pages" ON pages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pages" ON pages
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for daily_tasks
CREATE POLICY "Users can view own daily tasks" ON daily_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily tasks" ON daily_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily tasks" ON daily_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily tasks" ON daily_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pages_user_id ON pages(user_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent_id ON pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_id ON daily_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_completed ON daily_tasks(completed);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to automatically update updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_tasks_updated_at BEFORE UPDATE ON daily_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_data_updated_at BEFORE UPDATE ON finance_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for finance_data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'finance_data' AND policyname = 'Users can view own finance data') THEN
    CREATE POLICY "Users can view own finance data" ON finance_data
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'finance_data' AND policyname = 'Users can insert own finance data') THEN
    CREATE POLICY "Users can insert own finance data" ON finance_data
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'finance_data' AND policyname = 'Users can update own finance data') THEN
    CREATE POLICY "Users can update own finance data" ON finance_data
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'finance_data' AND policyname = 'Users can delete own finance data') THEN
    CREATE POLICY "Users can delete own finance data" ON finance_data
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
```

6. Click **"Run"** to execute the script
7. You should see success messages for each table creation

## Step 2: Verify Setup

After running the script, you should see three new tables in your Supabase project:
- `profiles` - stores user profile information
- `pages` - stores your workspace pages and notes  
- `daily_tasks` - stores your daily non-negotiables

## Step 3: Test the Application

1. Start your development server: `npm run dev`
2. Go to http://localhost:5173
3. You should see the login/signup page
4. Create a new account or sign in
5. Your workspace should load with Supabase authentication!

## What's Different Now?

✅ **Secure Authentication** - Users must sign up/login to access their data
✅ **Cloud Storage** - All data is saved to Supabase (no more localStorage)  
✅ **Multi-Device Sync** - Access your workspace from any device
✅ **Data Persistence** - Your data is safe and backed up in the cloud
✅ **User Isolation** - Each user only sees their own pages and tasks

## Troubleshooting

If you encounter any issues:
1. Check that all SQL commands executed successfully
2. Verify your environment variables are set correctly
3. Check the browser console for any error messages
4. Make sure your Supabase project is active and properly configured 