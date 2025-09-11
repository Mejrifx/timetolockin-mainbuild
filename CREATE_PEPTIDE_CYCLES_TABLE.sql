-- Create peptide_cycles table for tracking user peptide protocols
CREATE TABLE IF NOT EXISTS peptide_cycles (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  start_date DATE NOT NULL,
  cycle_length INTEGER NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'twice_daily', 'every_other_day', 'weekly')),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist (safe to run multiple times)
DO $$ BEGIN
    ALTER TABLE peptide_cycles ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE peptide_cycles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    ALTER TABLE peptide_cycles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE peptide_cycles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
END $$;

-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE peptide_cycles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for peptide_cycles if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'peptide_cycles' AND policyname = 'Users can view own peptide cycles') THEN
        CREATE POLICY "Users can view own peptide cycles" ON peptide_cycles FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'peptide_cycles' AND policyname = 'Users can insert own peptide cycles') THEN
        CREATE POLICY "Users can insert own peptide cycles" ON peptide_cycles FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'peptide_cycles' AND policyname = 'Users can update own peptide cycles') THEN
        CREATE POLICY "Users can update own peptide cycles" ON peptide_cycles FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'peptide_cycles' AND policyname = 'Users can delete own peptide cycles') THEN
        CREATE POLICY "Users can delete own peptide cycles" ON peptide_cycles FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create or replace the trigger for peptide_cycles
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_peptide_cycles_updated_at' AND tgrelid = 'public.peptide_cycles'::regclass) THEN
        CREATE TRIGGER update_peptide_cycles_updated_at
        BEFORE UPDATE ON peptide_cycles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_peptide_cycles_user_id ON peptide_cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_peptide_cycles_start_date ON peptide_cycles(start_date);
CREATE INDEX IF NOT EXISTS idx_peptide_cycles_is_active ON peptide_cycles(is_active);

-- Add comments for documentation
COMMENT ON TABLE peptide_cycles IS 'Stores user peptide cycle tracking data including protocols, dosages, and progress';
COMMENT ON COLUMN peptide_cycles.name IS 'Name of the peptide (e.g., BPC-157, TB-500)';
COMMENT ON COLUMN peptide_cycles.dosage IS 'Dosage amount and unit (e.g., 0.5mg, 250mcg)';
COMMENT ON COLUMN peptide_cycles.start_date IS 'Date when the peptide cycle started';
COMMENT ON COLUMN peptide_cycles.cycle_length IS 'Total length of the cycle in days';
COMMENT ON COLUMN peptide_cycles.frequency IS 'How often the peptide is taken (daily, twice_daily, etc.)';
COMMENT ON COLUMN peptide_cycles.notes IS 'User notes about the cycle, effects, or protocol';
COMMENT ON COLUMN peptide_cycles.is_active IS 'Whether the cycle is currently active';
