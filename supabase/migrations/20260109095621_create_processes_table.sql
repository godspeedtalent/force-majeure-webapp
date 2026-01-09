-- ============================================
-- PROCESSES - Generic process logging table
-- ============================================
-- This table stores records of various processes (imports, exports, batch operations)
-- with their status, metadata, and rollback data for potential reversal.

-- 1. Create enum for process status
CREATE TYPE process_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'rolled_back'
);

-- 2. Create table
CREATE TABLE IF NOT EXISTS processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Process identification
  process_type TEXT NOT NULL,  -- e.g., 'order_import', 'user_export', 'batch_update'
  name TEXT,                   -- Optional human-readable name for the process

  -- Status tracking
  status process_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Progress tracking
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  successful_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,

  -- Context and metadata
  metadata JSONB DEFAULT '{}'::JSONB,  -- Type-specific data (event_id, tier_id, etc.)

  -- Rollback support
  rollback_data JSONB DEFAULT '{}'::JSONB,  -- Data needed to reverse the process
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by UUID REFERENCES auth.users(id),

  -- Audit fields
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_processes_type ON processes(process_type);
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(status);
CREATE INDEX IF NOT EXISTS idx_processes_created_by ON processes(created_by);
CREATE INDEX IF NOT EXISTS idx_processes_created_at ON processes(created_at DESC);

-- 4. Enable RLS
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;

-- 5. Grant permissions (admin-only table)
GRANT SELECT, INSERT, UPDATE, DELETE ON processes TO authenticated;

-- 6. RLS Policies

-- Users can view their own processes
CREATE POLICY "Users can view own processes"
  ON processes FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

-- Admins/developers can view all processes
CREATE POLICY "Admins can view all processes"
  ON processes FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Admins/developers can insert processes
CREATE POLICY "Admins can insert processes"
  ON processes FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Admins/developers can update processes
CREATE POLICY "Admins can update processes"
  ON processes FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Admins/developers can delete processes
CREATE POLICY "Admins can delete processes"
  ON processes FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- 7. Create updated_at trigger
CREATE TRIGGER processes_updated_at
  BEFORE UPDATE ON processes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Create helper function for process items table
-- This table stores individual items processed within a process (for detailed logging)
CREATE TABLE IF NOT EXISTS process_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,

  -- Item identification
  item_index INTEGER NOT NULL,  -- Row number / sequence in the process
  external_id TEXT,             -- External reference (e.g., CSV row identifier)

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error', 'skipped')),
  error_message TEXT,

  -- Result references
  created_record_id UUID,       -- ID of record created by this item
  created_record_type TEXT,     -- Table name of created record

  -- Input/output data
  input_data JSONB DEFAULT '{}'::JSONB,
  output_data JSONB DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_process_items_process ON process_items(process_id);
CREATE INDEX IF NOT EXISTS idx_process_items_status ON process_items(status);
CREATE INDEX IF NOT EXISTS idx_process_items_created_record ON process_items(created_record_id) WHERE created_record_id IS NOT NULL;

-- Enable RLS
ALTER TABLE process_items ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON process_items TO authenticated;

-- RLS Policies for process_items (inherit from parent process)
CREATE POLICY "Users can view own process items"
  ON process_items FOR SELECT
  TO authenticated
  USING (
    process_id IN (
      SELECT id FROM processes WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can view all process items"
  ON process_items FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

CREATE POLICY "Admins can insert process items"
  ON process_items FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

CREATE POLICY "Admins can update process items"
  ON process_items FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

CREATE POLICY "Admins can delete process items"
  ON process_items FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );
