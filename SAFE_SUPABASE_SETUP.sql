-- timetolockin Database Setup Script (Safe Version)
-- This version handles existing triggers and other database objects safely

-- Create update function for timestamps (replace if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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
  blocks JSONB DEFAULT '[]',
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

-- 5. Create calendar_events table (for calendar functionality)
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Create RLS policies for pages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pages' AND policyname = 'Users can view own pages') THEN
    CREATE POLICY "Users can view own pages" ON pages
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pages' AND policyname = 'Users can insert own pages') THEN
    CREATE POLICY "Users can insert own pages" ON pages
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pages' AND policyname = 'Users can update own pages') THEN
    CREATE POLICY "Users can update own pages" ON pages
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pages' AND policyname = 'Users can delete own pages') THEN
    CREATE POLICY "Users can delete own pages" ON pages
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RLS policies for daily_tasks
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'daily_tasks' AND policyname = 'Users can view own daily tasks') THEN
    CREATE POLICY "Users can view own daily tasks" ON daily_tasks
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'daily_tasks' AND policyname = 'Users can insert own daily tasks') THEN
    CREATE POLICY "Users can insert own daily tasks" ON daily_tasks
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'daily_tasks' AND policyname = 'Users can update own daily tasks') THEN
    CREATE POLICY "Users can update own daily tasks" ON daily_tasks
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'daily_tasks' AND policyname = 'Users can delete own daily tasks') THEN
    CREATE POLICY "Users can delete own daily tasks" ON daily_tasks
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

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

-- Create RLS policies for calendar_events
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'calendar_events' AND policyname = 'Users can view own calendar events') THEN
    CREATE POLICY "Users can view own calendar events" ON calendar_events
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'calendar_events' AND policyname = 'Users can insert own calendar events') THEN
    CREATE POLICY "Users can insert own calendar events" ON calendar_events
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'calendar_events' AND policyname = 'Users can update own calendar events') THEN
    CREATE POLICY "Users can update own calendar events" ON calendar_events
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'calendar_events' AND policyname = 'Users can delete own calendar events') THEN
    CREATE POLICY "Users can delete own calendar events" ON calendar_events
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create update triggers (safe version that handles existing triggers)
DO $$ BEGIN
  -- Drop existing triggers if they exist, then recreate
  IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_profiles_updated_at') THEN
    DROP TRIGGER update_profiles_updated_at ON profiles;
  END IF;
  CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_pages_updated_at') THEN
    DROP TRIGGER update_pages_updated_at ON pages;
  END IF;
  CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_daily_tasks_updated_at') THEN
    DROP TRIGGER update_daily_tasks_updated_at ON daily_tasks;
  END IF;
  CREATE TRIGGER update_daily_tasks_updated_at BEFORE UPDATE ON daily_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_finance_data_updated_at') THEN
    DROP TRIGGER update_finance_data_updated_at ON finance_data;
  END IF;
  CREATE TRIGGER update_finance_data_updated_at BEFORE UPDATE ON finance_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_calendar_events_updated_at') THEN
    DROP TRIGGER update_calendar_events_updated_at ON calendar_events;
  END IF;
  CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;
