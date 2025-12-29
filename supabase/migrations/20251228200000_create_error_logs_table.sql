-- ============================================================
-- Error Logs Table
-- ============================================================
-- Persistent storage for application errors, API failures, and
-- client-side exceptions. Enables debugging production issues.
-- ============================================================

-- Create log level enum
DO $$ BEGIN
  CREATE TYPE error_log_level AS ENUM ('debug', 'info', 'warn', 'error', 'fatal');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create error source enum
DO $$ BEGIN
  CREATE TYPE error_log_source AS ENUM ('client', 'edge_function', 'database', 'external_service');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create the error_logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Log classification
  level error_log_level NOT NULL DEFAULT 'error',
  source error_log_source NOT NULL DEFAULT 'client',

  -- Error context
  message TEXT NOT NULL,
  error_code TEXT,                    -- e.g., 'PGRST116', 'ERR_NETWORK', custom codes

  -- Request context (for API errors)
  endpoint TEXT,                      -- e.g., '/rest/v1/events', '/functions/v1/checkout'
  method TEXT,                        -- HTTP method: GET, POST, etc.
  status_code INTEGER,                -- HTTP status code
  request_id TEXT,                    -- Correlation ID for tracing

  -- Error details
  stack_trace TEXT,                   -- JavaScript/TypeScript stack trace
  details JSONB DEFAULT '{}',         -- Structured error context (component, props, state, etc.)

  -- User context (nullable - may be anonymous)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,                    -- Browser session ID for grouping

  -- Client context
  user_agent TEXT,
  ip_address INET,
  page_url TEXT,                      -- URL where error occurred

  -- Environment
  environment TEXT DEFAULT 'production', -- 'development', 'staging', 'production'
  app_version TEXT,                   -- Frontend version/commit hash

  -- Metadata for flexible extension
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON public.error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_source ON public.error_logs(source);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_code ON public.error_logs(error_code);
CREATE INDEX IF NOT EXISTS idx_error_logs_endpoint ON public.error_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_error_logs_environment ON public.error_logs(environment);

-- Composite index for common filter patterns
CREATE INDEX IF NOT EXISTS idx_error_logs_level_created ON public.error_logs(level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_source_level ON public.error_logs(source, level);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Admins and developers can view all logs
CREATE POLICY "Admins can view error logs"
ON public.error_logs FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'developer'::app_role) OR
  is_dev_admin()
);

-- Anyone can insert logs (authenticated or anonymous)
-- This allows error logging from anywhere in the application
CREATE POLICY "Anyone can insert error logs"
ON public.error_logs FOR INSERT
WITH CHECK (true);

-- Admins can delete logs (for cleanup)
CREATE POLICY "Admins can delete error logs"
ON public.error_logs FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  is_dev_admin()
);

-- ============================================================
-- GRANTS
-- ============================================================

-- Grant SELECT to authenticated (RLS will restrict to admins/devs)
GRANT SELECT ON public.error_logs TO authenticated;

-- Grant INSERT to both authenticated and anonymous users
GRANT INSERT ON public.error_logs TO authenticated;
GRANT INSERT ON public.error_logs TO anon;

-- Grant DELETE to authenticated (RLS will restrict to admins)
GRANT DELETE ON public.error_logs TO authenticated;

-- Service role has full access (for Edge Functions)
GRANT ALL ON public.error_logs TO service_role;

-- ============================================================
-- Helper Function: Log Error (SECURITY DEFINER)
-- ============================================================
-- This function allows inserting logs without direct table access
-- Used by Edge Functions and client-side error handlers

CREATE OR REPLACE FUNCTION public.log_error(
  p_level error_log_level DEFAULT 'error',
  p_source error_log_source DEFAULT 'client',
  p_message TEXT DEFAULT '',
  p_error_code TEXT DEFAULT NULL,
  p_endpoint TEXT DEFAULT NULL,
  p_method TEXT DEFAULT NULL,
  p_status_code INTEGER DEFAULT NULL,
  p_request_id TEXT DEFAULT NULL,
  p_stack_trace TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_page_url TEXT DEFAULT NULL,
  p_environment TEXT DEFAULT 'production',
  p_app_version TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.error_logs (
    level,
    source,
    message,
    error_code,
    endpoint,
    method,
    status_code,
    request_id,
    stack_trace,
    details,
    user_id,
    session_id,
    user_agent,
    ip_address,
    page_url,
    environment,
    app_version,
    metadata
  ) VALUES (
    p_level,
    p_source,
    p_message,
    p_error_code,
    p_endpoint,
    p_method,
    p_status_code,
    p_request_id,
    p_stack_trace,
    p_details,
    COALESCE(p_user_id, auth.uid()),
    p_session_id,
    p_user_agent,
    p_ip_address,
    p_page_url,
    p_environment,
    p_app_version,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Grant execute to authenticated and anon (for pre-login errors)
GRANT EXECUTE ON FUNCTION public.log_error TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_error TO anon;

-- ============================================================
-- Archival Table (for logs older than retention period)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.error_logs_archive (
  LIKE public.error_logs INCLUDING ALL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Archive function
CREATE OR REPLACE FUNCTION public.archive_old_error_logs(
  p_retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_archived_count INTEGER;
BEGIN
  -- Move old logs to archive
  WITH moved AS (
    DELETE FROM public.error_logs
    WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL
    RETURNING *
  )
  INSERT INTO public.error_logs_archive (
    id, created_at, level, source, message, error_code, endpoint, method,
    status_code, request_id, stack_trace, details, user_id, session_id,
    user_agent, ip_address, page_url, environment, app_version, metadata
  )
  SELECT
    id, created_at, level, source, message, error_code, endpoint, method,
    status_code, request_id, stack_trace, details, user_id, session_id,
    user_agent, ip_address, page_url, environment, app_version, metadata
  FROM moved;

  GET DIAGNOSTICS v_archived_count = ROW_COUNT;

  RETURN v_archived_count;
END;
$$;

-- Grant execute to service_role only (for cron jobs)
GRANT EXECUTE ON FUNCTION public.archive_old_error_logs TO service_role;

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON TABLE public.error_logs IS 'Persistent storage for application errors and exceptions';
COMMENT ON COLUMN public.error_logs.level IS 'Severity level: debug, info, warn, error, fatal';
COMMENT ON COLUMN public.error_logs.source IS 'Origin of the error: client, edge_function, database, external_service';
COMMENT ON COLUMN public.error_logs.error_code IS 'Structured error code for categorization and alerting';
COMMENT ON COLUMN public.error_logs.details IS 'Structured JSON with component state, props, or additional context';
COMMENT ON COLUMN public.error_logs.session_id IS 'Browser session ID for grouping errors from same session';
COMMENT ON FUNCTION public.log_error IS 'SECURITY DEFINER function to insert error logs without direct table access';
