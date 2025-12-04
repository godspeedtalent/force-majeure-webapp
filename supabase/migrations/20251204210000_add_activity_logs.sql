-- Migration: Add Activity Logging Infrastructure
-- Description: Creates activity_logs and activity_logs_archive tables for admin audit trail

-- ============================================================================
-- SECTION 1: ENUMS
-- ============================================================================

-- Activity event categories
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_category') THEN
    CREATE TYPE activity_category AS ENUM (
      'account',      -- Account creation, role changes
      'event',        -- Event CUD operations
      'artist',       -- Artist CUD operations
      'venue',        -- Venue CUD operations
      'recording',    -- Recording CUD operations
      'ticket_tier',  -- Ticket tier CUD operations
      'ticket',       -- Ticket sales and scans
      'system'        -- System-level events
    );
  END IF;
END $$;

-- Activity event types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_event_type') THEN
    CREATE TYPE activity_event_type AS ENUM (
      -- Account events
      'account_created',
      'role_assigned',
      'role_removed',
      'permission_changed',
      -- Resource CUD events
      'resource_created',
      'resource_updated',
      'resource_deleted',
      -- Ticket events
      'ticket_sold',
      'ticket_scanned',
      'ticket_refunded',
      'ticket_cancelled'
    );
  END IF;
END $$;

-- ============================================================================
-- SECTION 2: MAIN ACTIVITY LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type activity_event_type NOT NULL,
  category activity_category NOT NULL,
  description TEXT NOT NULL,
  target_resource_type TEXT,
  target_resource_id UUID,
  target_resource_name TEXT, -- Cached name for display without joins
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 3: ARCHIVE TABLE (same structure + archived_at)
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_logs_archive (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  user_id UUID,
  event_type activity_event_type NOT NULL,
  category activity_category NOT NULL,
  description TEXT NOT NULL,
  target_resource_type TEXT,
  target_resource_id UUID,
  target_resource_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 4: INDEXES
-- ============================================================================

-- Main table indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON activity_logs(category);
CREATE INDEX IF NOT EXISTS idx_activity_logs_event_type ON activity_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_target_resource ON activity_logs(target_resource_type, target_resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category_timestamp ON activity_logs(category, timestamp DESC);

-- Archive table indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_archive_timestamp ON activity_logs_archive(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_archive_archived_at ON activity_logs_archive(archived_at);

-- ============================================================================
-- SECTION 5: COMMENTS
-- ============================================================================

COMMENT ON TABLE activity_logs IS 'Audit log of all administrative actions in the system';
COMMENT ON COLUMN activity_logs.target_resource_name IS 'Cached resource name to avoid joins in queries';
COMMENT ON COLUMN activity_logs.metadata IS 'JSONB containing before/after values, scan details, etc.';
COMMENT ON TABLE activity_logs_archive IS 'Archived activity logs older than 90 days';

-- ============================================================================
-- SECTION 6: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs_archive ENABLE ROW LEVEL SECURITY;

-- Only admins and developers can view activity logs
DROP POLICY IF EXISTS "Admins can view activity logs" ON activity_logs;
CREATE POLICY "Admins can view activity logs"
  ON activity_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));

-- Service role can insert (used by triggers and Edge Functions)
DROP POLICY IF EXISTS "Service role can insert activity logs" ON activity_logs;
CREATE POLICY "Service role can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true);

-- Only admins and developers can view archived logs
DROP POLICY IF EXISTS "Admins can view archived logs" ON activity_logs_archive;
CREATE POLICY "Admins can view archived logs"
  ON activity_logs_archive FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));

-- ============================================================================
-- SECTION 7: HELPER FUNCTION FOR LOGGING (used by Edge Functions)
-- ============================================================================

CREATE OR REPLACE FUNCTION log_activity(
  p_event_type activity_event_type,
  p_category activity_category,
  p_description TEXT,
  p_user_id UUID DEFAULT NULL,
  p_target_resource_type TEXT DEFAULT NULL,
  p_target_resource_id UUID DEFAULT NULL,
  p_target_resource_name TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_logs (
    event_type,
    category,
    description,
    user_id,
    target_resource_type,
    target_resource_id,
    target_resource_name,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_event_type,
    p_category,
    p_description,
    p_user_id,
    p_target_resource_type,
    p_target_resource_id,
    p_target_resource_name,
    p_metadata,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 8: ARCHIVAL FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION archive_old_activity_logs(p_retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  v_archived_count INTEGER;
  v_cutoff_date TIMESTAMPTZ;
BEGIN
  v_cutoff_date := NOW() - (p_retention_days || ' days')::INTERVAL;

  -- Move old logs to archive table
  WITH moved AS (
    DELETE FROM activity_logs
    WHERE timestamp < v_cutoff_date
    RETURNING *
  )
  INSERT INTO activity_logs_archive (
    id,
    timestamp,
    user_id,
    event_type,
    category,
    description,
    target_resource_type,
    target_resource_id,
    target_resource_name,
    metadata,
    ip_address,
    user_agent,
    created_at,
    archived_at
  )
  SELECT
    id,
    timestamp,
    user_id,
    event_type,
    category,
    description,
    target_resource_type,
    target_resource_id,
    target_resource_name,
    metadata,
    ip_address,
    user_agent,
    created_at,
    NOW()
  FROM moved;

  GET DIAGNOSTICS v_archived_count = ROW_COUNT;

  RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service_role for scheduled jobs
GRANT EXECUTE ON FUNCTION archive_old_activity_logs TO service_role;
GRANT EXECUTE ON FUNCTION log_activity TO service_role;
