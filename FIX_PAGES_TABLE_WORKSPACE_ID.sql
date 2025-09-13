-- Fix pages table to include workspace_id column
-- This script adds the missing workspace_id column to the pages table

-- Add workspace_id column to pages table
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS workspace_id TEXT;

-- Create workspaces table if it doesn't exist
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Workspace',
  description TEXT,
  icon TEXT DEFAULT 'workspace',
  color TEXT DEFAULT '#6366f1',
  is_default BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspaces
DROP POLICY IF EXISTS "Users can view own workspaces" ON workspaces;
CREATE POLICY "Users can view own workspaces" ON workspaces
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own workspaces" ON workspaces;
CREATE POLICY "Users can insert own workspaces" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own workspaces" ON workspaces;
CREATE POLICY "Users can update own workspaces" ON workspaces
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own workspaces" ON workspaces;
CREATE POLICY "Users can delete own workspaces" ON workspaces
  FOR DELETE USING (auth.uid() = user_id);

-- Create default workspace for existing users
INSERT INTO workspaces (id, user_id, name, is_default, created_at, updated_at)
SELECT 
  'workspace_' || user_id::text as id,
  user_id,
  'My Workspace' as name,
  true as is_default,
  NOW() as created_at,
  NOW() as updated_at
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM workspaces WHERE workspaces.user_id = profiles.id
);

-- Update existing pages to reference the default workspace
UPDATE pages 
SET workspace_id = 'workspace_' || user_id::text
WHERE workspace_id IS NULL;

-- Add foreign key constraint for workspace_id
ALTER TABLE pages 
ADD CONSTRAINT fk_pages_workspace_id 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_pages_workspace_id ON pages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);

-- Add trigger for updated_at on workspaces
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Make workspace_id NOT NULL after populating it
ALTER TABLE pages ALTER COLUMN workspace_id SET NOT NULL;

-- Verify the fix
SELECT 
  'Pages table structure:' as info,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'pages' 
ORDER BY ordinal_position;

SELECT 
  'Workspaces table structure:' as info,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'workspaces' 
ORDER BY ordinal_position;
