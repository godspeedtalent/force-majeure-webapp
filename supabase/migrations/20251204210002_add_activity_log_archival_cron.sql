-- Migration: Add pg_cron Archival Schedule for Activity Logs
-- Description: Creates a scheduled job to archive activity logs older than 90 days

-- ============================================================================
-- SECTION 1: ENABLE PG_CRON EXTENSION
-- ============================================================================

-- pg_cron is typically already enabled in Supabase, but we ensure it exists
-- Note: This requires superuser privileges in Supabase dashboard if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- SECTION 2: CREATE SCHEDULED ARCHIVAL JOB
-- ============================================================================

-- Schedule the archival function to run daily at 3:00 AM UTC
-- This timing is chosen to run during low-traffic hours
SELECT cron.schedule(
  'archive-activity-logs',           -- Job name
  '0 3 * * *',                       -- Cron expression: 3:00 AM UTC daily
  $$SELECT archive_old_activity_logs(90)$$  -- Archive logs older than 90 days
);

-- ============================================================================
-- SECTION 3: HELPER FUNCTION TO CHECK JOB STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_activity_log_archive_status()
RETURNS TABLE (
  job_name TEXT,
  schedule TEXT,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.jobname::TEXT,
    j.schedule::TEXT,
    jr.start_time AS last_run,
    j.next_run,
    j.active
  FROM cron.job j
  LEFT JOIN LATERAL (
    SELECT start_time
    FROM cron.job_run_details
    WHERE jobid = j.jobid
    ORDER BY start_time DESC
    LIMIT 1
  ) jr ON true
  WHERE j.jobname = 'archive-activity-logs';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION get_activity_log_archive_status TO service_role;

-- ============================================================================
-- SECTION 4: MANUAL ARCHIVE TRIGGER FUNCTION (for admin use)
-- ============================================================================

-- This function allows admins to manually trigger archival
CREATE OR REPLACE FUNCTION trigger_activity_log_archive(p_retention_days INTEGER DEFAULT 90)
RETURNS JSONB AS $$
DECLARE
  v_archived_count INTEGER;
  v_archive_before TIMESTAMPTZ;
BEGIN
  v_archive_before := NOW() - (p_retention_days || ' days')::INTERVAL;

  -- Call the archival function
  v_archived_count := archive_old_activity_logs(p_retention_days);

  RETURN jsonb_build_object(
    'success', true,
    'archived_count', v_archived_count,
    'archived_before', v_archive_before,
    'retention_days', p_retention_days
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION trigger_activity_log_archive TO service_role;

-- ============================================================================
-- SECTION 5: COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_activity_log_archive_status IS 'Returns the status of the activity log archival cron job';
COMMENT ON FUNCTION trigger_activity_log_archive IS 'Manually triggers activity log archival for admin use';
