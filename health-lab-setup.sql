-- Health Lab Setup SQL for Supabase
-- Copy and paste this entire script into your Supabase SQL Editor

-- 1. Create health_protocols table (for health optimization protocols)
CREATE TABLE IF NOT EXISTS health_protocols (
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

-- 2. Create quit_habits table (for tracking habits users want to quit)
CREATE TABLE IF NOT EXISTS quit_habits (
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

-- 3. Create health_settings table (for user health preferences)
CREATE TABLE IF NOT EXISTS health_settings (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  reminder_enabled BOOLEAN DEFAULT true,
  daily_checkin_time TIME,
  weekly_review_day INTEGER CHECK (weekly_review_day BETWEEN 0 AND 6) DEFAULT 0,
  notification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for Health Lab tables
ALTER TABLE health_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE quit_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for health_protocols
CREATE POLICY "Users can view own health protocols" ON health_protocols
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health protocols" ON health_protocols
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health protocols" ON health_protocols
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health protocols" ON health_protocols
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for quit_habits
CREATE POLICY "Users can view own quit habits" ON quit_habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quit habits" ON quit_habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quit habits" ON quit_habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quit habits" ON quit_habits
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for health_settings
CREATE POLICY "Users can view own health settings" ON health_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health settings" ON health_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health settings" ON health_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health settings" ON health_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_protocols_user_id ON health_protocols(user_id);
CREATE INDEX IF NOT EXISTS idx_health_protocols_category ON health_protocols(category);
CREATE INDEX IF NOT EXISTS idx_health_protocols_completed ON health_protocols(is_completed);

CREATE INDEX IF NOT EXISTS idx_quit_habits_user_id ON quit_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_quit_habits_category ON quit_habits(category);
CREATE INDEX IF NOT EXISTS idx_quit_habits_active ON quit_habits(is_active);
CREATE INDEX IF NOT EXISTS idx_quit_habits_quit_date ON quit_habits(quit_date);

-- Add triggers to automatically update updated_at columns
CREATE TRIGGER update_health_protocols_updated_at BEFORE UPDATE ON health_protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quit_habits_updated_at BEFORE UPDATE ON quit_habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_settings_updated_at BEFORE UPDATE ON health_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
