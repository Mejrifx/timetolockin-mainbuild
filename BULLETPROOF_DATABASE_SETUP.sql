-- 🚀 BULLETPROOF DATABASE SETUP FOR GM AI WEB APP
-- Simplified, guaranteed-to-work schema for new Supabase project
-- Run this COMPLETE script in your new Supabase SQL Editor

-- ==========================================
-- 1. UTILITY FUNCTIONS
-- ==========================================

-- Create update function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- 2. CORE TABLES (Essential for app to work)
-- ==========================================

-- PROFILES table (user information)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PAGES table (workspace pages/documents)
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

-- DAILY_TASKS table (daily non-negotiables)
CREATE TABLE daily_tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  time_allocation INTEGER NOT NULL DEFAULT 30,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL DEFAULT 'Personal',
  completed BOOLEAN DEFAULT false,
  streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FINANCE_DATA table (financial tracking)
CREATE TABLE finance_data (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{
    "currentBalance": 0,
    "monthlyIncome": 0,
    "monthlyExpenses": 0,
    "wallets": {},
    "transactions": {},
    "categories": {},
    "budgets": {},
    "goals": {},
    "settings": {
      "currency": "USD",
      "budgetPeriod": "monthly",
      "notifications": true
    }
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HEALTH_PROTOCOLS table (health optimization protocols)
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

-- QUIT_HABITS table (habits to quit tracking)
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

-- HEALTH_SETTINGS table (user health preferences)
CREATE TABLE health_settings (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  reminder_enabled BOOLEAN DEFAULT true,
  daily_checkin_time TIME DEFAULT '09:00:00',
  weekly_review_day INTEGER CHECK (weekly_review_day BETWEEN 0 AND 6) DEFAULT 0,
  notification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CALENDAR_EVENTS table (calendar functionality)
CREATE TABLE calendar_events (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  is_all_day BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. PERFORMANCE INDEXES
-- ==========================================

-- Pages indexes
CREATE INDEX idx_pages_user_id ON pages(user_id);
CREATE INDEX idx_pages_parent_id ON pages(parent_id);
CREATE INDEX idx_pages_created_at ON pages(created_at);

-- Daily tasks indexes
CREATE INDEX idx_daily_tasks_user_id ON daily_tasks(user_id);
CREATE INDEX idx_daily_tasks_completed ON daily_tasks(completed);
CREATE INDEX idx_daily_tasks_priority ON daily_tasks(priority);

-- Health protocols indexes
CREATE INDEX idx_health_protocols_user_id ON health_protocols(user_id);
CREATE INDEX idx_health_protocols_category ON health_protocols(category);

-- Quit habits indexes
CREATE INDEX idx_quit_habits_user_id ON quit_habits(user_id);
CREATE INDEX idx_quit_habits_active ON quit_habits(is_active);
CREATE INDEX idx_quit_habits_quit_date ON quit_habits(quit_date);

-- Calendar events indexes
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_date ON calendar_events(event_date);

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE quit_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 5. RLS POLICIES
-- ==========================================

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- PAGES policies
CREATE POLICY "Users can view own pages" ON pages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pages" ON pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pages" ON pages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pages" ON pages
  FOR DELETE USING (auth.uid() = user_id);

-- DAILY_TASKS policies
CREATE POLICY "Users can view own daily tasks" ON daily_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily tasks" ON daily_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily tasks" ON daily_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily tasks" ON daily_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- FINANCE_DATA policies
CREATE POLICY "Users can view own finance data" ON finance_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own finance data" ON finance_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own finance data" ON finance_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own finance data" ON finance_data
  FOR DELETE USING (auth.uid() = user_id);

-- HEALTH_PROTOCOLS policies
CREATE POLICY "Users can view own health protocols" ON health_protocols
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health protocols" ON health_protocols
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health protocols" ON health_protocols
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health protocols" ON health_protocols
  FOR DELETE USING (auth.uid() = user_id);

-- QUIT_HABITS policies
CREATE POLICY "Users can view own quit habits" ON quit_habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quit habits" ON quit_habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quit habits" ON quit_habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quit habits" ON quit_habits
  FOR DELETE USING (auth.uid() = user_id);

-- HEALTH_SETTINGS policies
CREATE POLICY "Users can view own health settings" ON health_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health settings" ON health_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health settings" ON health_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- CALENDAR_EVENTS policies
CREATE POLICY "Users can view own calendar events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events" ON calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events" ON calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 6. TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ==========================================

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at 
  BEFORE UPDATE ON pages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_tasks_updated_at 
  BEFORE UPDATE ON daily_tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_data_updated_at 
  BEFORE UPDATE ON finance_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_protocols_updated_at 
  BEFORE UPDATE ON health_protocols 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quit_habits_updated_at 
  BEFORE UPDATE ON quit_habits 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_settings_updated_at 
  BEFORE UPDATE ON health_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at 
  BEFORE UPDATE ON calendar_events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 7. VERIFICATION
-- ==========================================

-- Verify all tables were created
SELECT 'TABLES CREATED:' as status;
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'pages', 'daily_tasks', 'finance_data', 'health_protocols', 'quit_habits', 'health_settings', 'calendar_events')
ORDER BY tablename;

-- Verify RLS is enabled
SELECT 'RLS STATUS:' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'pages', 'daily_tasks', 'finance_data', 'health_protocols', 'quit_habits', 'health_settings', 'calendar_events')
ORDER BY tablename;

-- Count policies created
SELECT 'POLICIES CREATED:' as status;
SELECT COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public';

-- Final success message
SELECT '🎉 BULLETPROOF DATABASE SETUP COMPLETE! 🎉' as result,
       'Your GM AI Web App database is ready with:' as info1,
       '✅ Bulletproof user isolation' as feature1,
       '✅ Optimized performance indexes' as feature2,
       '✅ Complete RLS security' as feature3,
       '✅ All essential tables' as feature4,
       '✅ No complex triggers that can fail' as feature5,
       '🚀 Ready for user signups!' as ready;
