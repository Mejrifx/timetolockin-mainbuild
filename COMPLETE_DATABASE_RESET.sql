-- COMPLETE DATABASE RESET - NUCLEAR OPTION
-- ⚠️  WARNING: THIS WILL DELETE ALL DATA! ⚠️
-- Only run this if you want to start completely fresh

-- 1. DROP ALL TABLES (this will delete all data)
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS health_settings CASCADE;
DROP TABLE IF EXISTS quit_habits CASCADE;
DROP TABLE IF EXISTS health_protocols CASCADE;
DROP TABLE IF EXISTS finance_data CASCADE;
DROP TABLE IF EXISTS daily_tasks CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. DROP FUNCTIONS
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 3. RECREATE EVERYTHING FROM SCRATCH

-- Create update function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Create profiles table (for user information)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create pages table
CREATE TABLE pages (
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

-- 3. Create daily_tasks table
CREATE TABLE daily_tasks (
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

-- 4. Create finance_data table
CREATE TABLE finance_data (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create health_protocols table
CREATE TABLE health_protocols (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('fitness', 'nutrition', 'sleep', 'mental', 'habits', 'other')) NOT NULL DEFAULT 'other',
  is_expanded BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create quit_habits table
CREATE TABLE quit_habits (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  quit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT CHECK (category IN ('smoking', 'alcohol', 'sugar', 'social_media', 'caffeine', 'other')) NOT NULL DEFAULT 'other',
  custom_category TEXT,
  is_active BOOLEAN DEFAULT true,
  milestones JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create health_settings table
CREATE TABLE health_settings (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  reminder_enabled BOOLEAN DEFAULT true,
  daily_checkin_time TIME,
  weekly_review_day INTEGER CHECK (weekly_review_day BETWEEN 0 AND 6) DEFAULT 0,
  notification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create calendar_events table
CREATE TABLE calendar_events (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE quit_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- CREATE ALL RLS POLICIES

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- PAGES policies
CREATE POLICY "Users can view own pages" ON pages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pages" ON pages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pages" ON pages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pages" ON pages FOR DELETE USING (auth.uid() = user_id);

-- DAILY_TASKS policies
CREATE POLICY "Users can view own daily tasks" ON daily_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily tasks" ON daily_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily tasks" ON daily_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own daily tasks" ON daily_tasks FOR DELETE USING (auth.uid() = user_id);

-- FINANCE_DATA policies
CREATE POLICY "Users can view own finance data" ON finance_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance data" ON finance_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance data" ON finance_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance data" ON finance_data FOR DELETE USING (auth.uid() = user_id);

-- HEALTH_PROTOCOLS policies
CREATE POLICY "Users can view own health protocols" ON health_protocols FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health protocols" ON health_protocols FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health protocols" ON health_protocols FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own health protocols" ON health_protocols FOR DELETE USING (auth.uid() = user_id);

-- QUIT_HABITS policies
CREATE POLICY "Users can view own quit habits" ON quit_habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quit habits" ON quit_habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quit habits" ON quit_habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quit habits" ON quit_habits FOR DELETE USING (auth.uid() = user_id);

-- HEALTH_SETTINGS policies
CREATE POLICY "Users can view own health settings" ON health_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health settings" ON health_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health settings" ON health_settings FOR UPDATE USING (auth.uid() = user_id);

-- CALENDAR_EVENTS policies
CREATE POLICY "Users can view own calendar events" ON calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calendar events" ON calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendar events" ON calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendar events" ON calendar_events FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_tasks_updated_at BEFORE UPDATE ON daily_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_finance_data_updated_at BEFORE UPDATE ON finance_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_protocols_updated_at BEFORE UPDATE ON health_protocols FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quit_habits_updated_at BEFORE UPDATE ON quit_habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_settings_updated_at BEFORE UPDATE ON health_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT '🔥 COMPLETE DATABASE RESET SUCCESSFUL! All tables recreated with proper user isolation.' as result;
