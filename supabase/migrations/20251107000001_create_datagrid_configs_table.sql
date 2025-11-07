-- ========================================
-- Create Data Grid Configurations Table
-- ========================================
-- This table stores user-specific data grid configurations
-- including column order, visibility, and other preferences

-- Create datagrid_configs table
CREATE TABLE IF NOT EXISTS public.datagrid_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grid_id TEXT NOT NULL, -- Identifier for the grid (e.g., 'admin-users', 'admin-venues', 'dev-artists')
  config JSONB NOT NULL DEFAULT '{}'::jsonb, -- Stores column order, visibility, widths, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, grid_id)
);

-- Add comment
COMMENT ON TABLE public.datagrid_configs IS 'Stores user-specific data grid configurations';
COMMENT ON COLUMN public.datagrid_configs.user_id IS 'User who owns this configuration';
COMMENT ON COLUMN public.datagrid_configs.grid_id IS 'Unique identifier for the grid instance';
COMMENT ON COLUMN public.datagrid_configs.config IS 'JSON configuration: {columns: [{key, visible, order, width}], pageSize, sortBy}';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_datagrid_configs_user_grid ON public.datagrid_configs(user_id, grid_id);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_datagrid_configs_updated_at ON public.datagrid_configs;
CREATE TRIGGER update_datagrid_configs_updated_at
BEFORE UPDATE ON public.datagrid_configs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.datagrid_configs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own configs
CREATE POLICY "Users can view own datagrid configs"
ON public.datagrid_configs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own configs
CREATE POLICY "Users can insert own datagrid configs"
ON public.datagrid_configs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own configs
CREATE POLICY "Users can update own datagrid configs"
ON public.datagrid_configs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own configs
CREATE POLICY "Users can delete own datagrid configs"
ON public.datagrid_configs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Example config structure:
-- {
--   "columns": [
--     {"key": "name", "visible": true, "order": 0, "width": 200},
--     {"key": "email", "visible": true, "order": 1, "width": 250},
--     {"key": "created_at", "visible": false, "order": 2}
--   ],
--   "pageSize": 25,
--   "sortBy": {"column": "name", "direction": "asc"}
-- }
