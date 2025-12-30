-- ============================================================
-- Page Analytics Suite
-- ============================================================
-- Comprehensive analytics for tracking page views, sessions,
-- conversion funnel, and performance metrics.
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

-- Page view source type
DO $$ BEGIN
  CREATE TYPE analytics_page_source AS ENUM (
    'direct',           -- Direct URL entry
    'internal',         -- Internal navigation
    'external',         -- External referrer
    'search_engine',    -- From search engine
    'social',           -- From social media
    'email',            -- From email campaign
    'advertisement'     -- From paid ads
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Funnel event type
DO $$ BEGIN
  CREATE TYPE funnel_event_type AS ENUM (
    'event_view',           -- Viewed event details page
    'ticket_tier_view',     -- Viewed ticket tier options
    'add_to_cart',          -- Added ticket(s) to cart
    'checkout_start',       -- Started checkout process
    'checkout_complete',    -- Completed purchase
    'checkout_abandon',     -- Abandoned checkout
    'cart_abandon'          -- Abandoned cart
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Performance metric type
DO $$ BEGIN
  CREATE TYPE performance_metric_type AS ENUM (
    'page_load',                  -- Full page load time
    'first_contentful_paint',     -- FCP
    'largest_contentful_paint',   -- LCP
    'first_input_delay',          -- FID
    'interaction_to_next_paint',  -- INP
    'cumulative_layout_shift',    -- CLS
    'time_to_first_byte',         -- TTFB
    'api_response'                -- API call latency
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLES
-- ============================================================

-- 1. SESSIONS TABLE
-- Tracks user sessions for grouping page views
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,  -- Client-generated session ID

  -- User context (nullable - may be anonymous)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Session metadata
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_duration_ms INTEGER,        -- Calculated on session end
  page_count INTEGER DEFAULT 1,

  -- Entry/exit tracking
  entry_page TEXT,
  exit_page TEXT,
  referrer TEXT,

  -- UTM parameters
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,

  -- Client context
  user_agent TEXT,
  ip_address INET,
  device_type TEXT,                 -- 'mobile', 'tablet', 'desktop'
  browser TEXT,
  os TEXT,
  screen_width INTEGER,
  screen_height INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON public.analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON public.analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started_at ON public.analytics_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_entry_page ON public.analytics_sessions(entry_page);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_utm_source ON public.analytics_sessions(utm_source);

-- 2. PAGE VIEWS TABLE
-- Individual page view events
CREATE TABLE IF NOT EXISTS public.analytics_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_ref UUID REFERENCES public.analytics_sessions(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,         -- Redundant for quick queries without join

  -- User context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Page info
  page_path TEXT NOT NULL,
  page_title TEXT,
  page_type TEXT,                   -- 'event', 'venue', 'artist', 'checkout', 'home', etc.
  resource_id UUID,                 -- ID of event/venue/artist if applicable

  -- Timing
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_on_page_ms INTEGER,          -- Updated via beacon/unload
  scroll_depth_percent INTEGER,     -- Max scroll depth (0-100)

  -- Navigation context
  source analytics_page_source NOT NULL DEFAULT 'internal',
  referrer_page TEXT,               -- Previous page in session

  -- Client context
  user_agent TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for page views
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.analytics_page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session_ref ON public.analytics_page_views(session_ref);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON public.analytics_page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON public.analytics_page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_page_type ON public.analytics_page_views(page_type);
CREATE INDEX IF NOT EXISTS idx_page_views_resource_id ON public.analytics_page_views(resource_id);
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON public.analytics_page_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_composite ON public.analytics_page_views(page_type, viewed_at DESC);

-- 3. FUNNEL EVENTS TABLE
-- Conversion funnel tracking
CREATE TABLE IF NOT EXISTS public.analytics_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,

  -- User context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Event classification
  event_type funnel_event_type NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  -- Related entities
  ticket_tier_id UUID REFERENCES public.ticket_tiers(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  cart_id TEXT,                     -- Shopping cart session ID

  -- Timing metrics
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_since_session_start_ms INTEGER,
  time_since_event_view_ms INTEGER, -- Time since first viewing this event

  -- Value tracking
  quantity INTEGER,
  value_cents INTEGER,              -- For checkout events

  -- Additional context
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for funnel events
CREATE INDEX IF NOT EXISTS idx_funnel_events_session_id ON public.analytics_funnel_events(session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_user_id ON public.analytics_funnel_events(user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_event_type ON public.analytics_funnel_events(event_type);
CREATE INDEX IF NOT EXISTS idx_funnel_events_event_id ON public.analytics_funnel_events(event_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_occurred_at ON public.analytics_funnel_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_events_composite ON public.analytics_funnel_events(event_id, event_type, occurred_at);

-- 4. PERFORMANCE METRICS TABLE
-- Web Vitals and API latency
CREATE TABLE IF NOT EXISTS public.analytics_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,

  -- Metric details
  metric_type performance_metric_type NOT NULL,
  metric_value NUMERIC NOT NULL,    -- Value in appropriate unit (ms, score, etc.)
  metric_rating TEXT,               -- 'good', 'needs-improvement', 'poor'

  -- Context
  page_path TEXT NOT NULL,
  endpoint TEXT,                    -- For API metrics

  -- Timing
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Additional context
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_performance_session_id ON public.analytics_performance(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metric_type ON public.analytics_performance(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_recorded_at ON public.analytics_performance(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_page_path ON public.analytics_performance(page_path);
CREATE INDEX IF NOT EXISTS idx_performance_composite ON public.analytics_performance(metric_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_rating ON public.analytics_performance(metric_rating);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_performance ENABLE ROW LEVEL SECURITY;

-- SESSIONS POLICIES
CREATE POLICY "Anyone can insert sessions"
  ON public.analytics_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update own session by session_id"
  ON public.analytics_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view all sessions"
  ON public.analytics_sessions FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- PAGE VIEWS POLICIES
CREATE POLICY "Anyone can insert page views"
  ON public.analytics_page_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update page views"
  ON public.analytics_page_views FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view all page views"
  ON public.analytics_page_views FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- FUNNEL EVENTS POLICIES
CREATE POLICY "Anyone can insert funnel events"
  ON public.analytics_funnel_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all funnel events"
  ON public.analytics_funnel_events FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- PERFORMANCE METRICS POLICIES
CREATE POLICY "Anyone can insert performance metrics"
  ON public.analytics_performance FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all performance metrics"
  ON public.analytics_performance FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- ============================================================
-- GRANTS
-- ============================================================

-- Sessions
GRANT SELECT ON public.analytics_sessions TO authenticated;
GRANT INSERT, UPDATE ON public.analytics_sessions TO authenticated;
GRANT INSERT, UPDATE ON public.analytics_sessions TO anon;

-- Page Views
GRANT SELECT ON public.analytics_page_views TO authenticated;
GRANT INSERT, UPDATE ON public.analytics_page_views TO authenticated;
GRANT INSERT, UPDATE ON public.analytics_page_views TO anon;

-- Funnel Events
GRANT SELECT ON public.analytics_funnel_events TO authenticated;
GRANT INSERT ON public.analytics_funnel_events TO authenticated;
GRANT INSERT ON public.analytics_funnel_events TO anon;

-- Performance
GRANT SELECT ON public.analytics_performance TO authenticated;
GRANT INSERT ON public.analytics_performance TO authenticated;
GRANT INSERT ON public.analytics_performance TO anon;

-- Service role full access
GRANT ALL ON public.analytics_sessions TO service_role;
GRANT ALL ON public.analytics_page_views TO service_role;
GRANT ALL ON public.analytics_funnel_events TO service_role;
GRANT ALL ON public.analytics_performance TO service_role;

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================================

-- Record a page view (fire-and-forget)
CREATE OR REPLACE FUNCTION public.record_page_view(
  p_session_id TEXT,
  p_page_path TEXT,
  p_page_title TEXT DEFAULT NULL,
  p_page_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_source analytics_page_source DEFAULT 'internal',
  p_referrer_page TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_viewport_width INTEGER DEFAULT NULL,
  p_viewport_height INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_view_id UUID;
  v_user_id UUID;
  v_session_ref UUID;
BEGIN
  v_user_id := auth.uid();

  -- Get or create session reference
  SELECT id INTO v_session_ref
  FROM public.analytics_sessions
  WHERE session_id = p_session_id
  LIMIT 1;

  -- If no session exists, create one
  IF v_session_ref IS NULL THEN
    INSERT INTO public.analytics_sessions (
      session_id,
      user_id,
      entry_page,
      user_agent
    ) VALUES (
      p_session_id,
      v_user_id,
      p_page_path,
      p_user_agent
    )
    RETURNING id INTO v_session_ref;
  ELSE
    -- Update page count and exit page
    UPDATE public.analytics_sessions
    SET page_count = page_count + 1,
        exit_page = p_page_path,
        user_id = COALESCE(user_id, v_user_id)  -- Update user_id if was anonymous
    WHERE id = v_session_ref;
  END IF;

  -- Insert page view
  INSERT INTO public.analytics_page_views (
    session_ref,
    session_id,
    user_id,
    page_path,
    page_title,
    page_type,
    resource_id,
    source,
    referrer_page,
    user_agent,
    viewport_width,
    viewport_height
  ) VALUES (
    v_session_ref,
    p_session_id,
    v_user_id,
    p_page_path,
    p_page_title,
    p_page_type,
    p_resource_id,
    p_source,
    p_referrer_page,
    p_user_agent,
    p_viewport_width,
    p_viewport_height
  )
  RETURNING id INTO v_view_id;

  RETURN v_view_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_page_view TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_page_view TO anon;

-- Record funnel event
CREATE OR REPLACE FUNCTION public.record_funnel_event(
  p_session_id TEXT,
  p_event_type funnel_event_type,
  p_event_id UUID,
  p_ticket_tier_id UUID DEFAULT NULL,
  p_order_id UUID DEFAULT NULL,
  p_cart_id TEXT DEFAULT NULL,
  p_quantity INTEGER DEFAULT NULL,
  p_value_cents INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_funnel_id UUID;
  v_user_id UUID;
  v_session_start TIMESTAMPTZ;
  v_first_event_view TIMESTAMPTZ;
  v_time_since_session INTEGER;
  v_time_since_event_view INTEGER;
BEGIN
  v_user_id := auth.uid();

  -- Get session start time
  SELECT started_at INTO v_session_start
  FROM public.analytics_sessions
  WHERE session_id = p_session_id
  LIMIT 1;

  -- Get first event_view for this event in this session
  SELECT MIN(occurred_at) INTO v_first_event_view
  FROM public.analytics_funnel_events
  WHERE session_id = p_session_id
    AND event_id = p_event_id
    AND event_type = 'event_view';

  -- Calculate time differences
  IF v_session_start IS NOT NULL THEN
    v_time_since_session := EXTRACT(EPOCH FROM (NOW() - v_session_start))::INTEGER * 1000;
  END IF;

  IF v_first_event_view IS NOT NULL THEN
    v_time_since_event_view := EXTRACT(EPOCH FROM (NOW() - v_first_event_view))::INTEGER * 1000;
  END IF;

  INSERT INTO public.analytics_funnel_events (
    session_id,
    user_id,
    event_type,
    event_id,
    ticket_tier_id,
    order_id,
    cart_id,
    quantity,
    value_cents,
    time_since_session_start_ms,
    time_since_event_view_ms,
    metadata
  ) VALUES (
    p_session_id,
    v_user_id,
    p_event_type,
    p_event_id,
    p_ticket_tier_id,
    p_order_id,
    p_cart_id,
    p_quantity,
    p_value_cents,
    v_time_since_session,
    v_time_since_event_view,
    p_metadata
  )
  RETURNING id INTO v_funnel_id;

  RETURN v_funnel_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_funnel_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_funnel_event TO anon;

-- Record performance metric
CREATE OR REPLACE FUNCTION public.record_performance_metric(
  p_session_id TEXT,
  p_metric_type performance_metric_type,
  p_metric_value NUMERIC,
  p_page_path TEXT,
  p_metric_rating TEXT DEFAULT NULL,
  p_endpoint TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metric_id UUID;
BEGIN
  INSERT INTO public.analytics_performance (
    session_id,
    metric_type,
    metric_value,
    metric_rating,
    page_path,
    endpoint,
    metadata
  ) VALUES (
    p_session_id,
    p_metric_type,
    p_metric_value,
    p_metric_rating,
    p_page_path,
    p_endpoint,
    p_metadata
  )
  RETURNING id INTO v_metric_id;

  RETURN v_metric_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_performance_metric TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_performance_metric TO anon;

-- Update page view with time-on-page (called via beacon)
CREATE OR REPLACE FUNCTION public.update_page_view_duration(
  p_view_id UUID,
  p_time_on_page_ms INTEGER,
  p_scroll_depth_percent INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.analytics_page_views
  SET
    time_on_page_ms = p_time_on_page_ms,
    scroll_depth_percent = COALESCE(p_scroll_depth_percent, scroll_depth_percent)
  WHERE id = p_view_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_page_view_duration TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_page_view_duration TO anon;

-- End session
CREATE OR REPLACE FUNCTION public.end_analytics_session(
  p_session_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.analytics_sessions
  SET
    ended_at = NOW(),
    total_duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER * 1000
  WHERE session_id = p_session_id
    AND ended_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.end_analytics_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_analytics_session TO anon;

-- Initialize or update session with full details
CREATE OR REPLACE FUNCTION public.init_analytics_session(
  p_session_id TEXT,
  p_entry_page TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_utm_source TEXT DEFAULT NULL,
  p_utm_medium TEXT DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL,
  p_utm_term TEXT DEFAULT NULL,
  p_utm_content TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_browser TEXT DEFAULT NULL,
  p_os TEXT DEFAULT NULL,
  p_screen_width INTEGER DEFAULT NULL,
  p_screen_height INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_ref UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Check if session exists
  SELECT id INTO v_session_ref
  FROM public.analytics_sessions
  WHERE session_id = p_session_id
  LIMIT 1;

  IF v_session_ref IS NULL THEN
    -- Create new session
    INSERT INTO public.analytics_sessions (
      session_id,
      user_id,
      entry_page,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      user_agent,
      device_type,
      browser,
      os,
      screen_width,
      screen_height
    ) VALUES (
      p_session_id,
      v_user_id,
      p_entry_page,
      p_referrer,
      p_utm_source,
      p_utm_medium,
      p_utm_campaign,
      p_utm_term,
      p_utm_content,
      p_user_agent,
      p_device_type,
      p_browser,
      p_os,
      p_screen_width,
      p_screen_height
    )
    RETURNING id INTO v_session_ref;
  ELSE
    -- Update user_id if was anonymous and now authenticated
    UPDATE public.analytics_sessions
    SET user_id = COALESCE(user_id, v_user_id)
    WHERE id = v_session_ref;
  END IF;

  RETURN v_session_ref;
END;
$$;

GRANT EXECUTE ON FUNCTION public.init_analytics_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.init_analytics_session TO anon;

-- ============================================================
-- ARCHIVE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.analytics_page_views_archive (
  LIKE public.analytics_page_views INCLUDING ALL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics_funnel_events_archive (
  LIKE public.analytics_funnel_events INCLUDING ALL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics_sessions_archive (
  LIKE public.analytics_sessions INCLUDING ALL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Archive function
CREATE OR REPLACE FUNCTION public.archive_old_analytics(
  p_retention_days INTEGER DEFAULT 90
)
RETURNS TABLE(sessions_archived INTEGER, page_views_archived INTEGER, funnel_events_archived INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sessions_count INTEGER := 0;
  v_page_views_count INTEGER := 0;
  v_funnel_events_count INTEGER := 0;
  v_cutoff_date TIMESTAMPTZ;
BEGIN
  v_cutoff_date := NOW() - (p_retention_days || ' days')::INTERVAL;

  -- Archive page views first (due to FK)
  WITH moved_pv AS (
    DELETE FROM public.analytics_page_views
    WHERE viewed_at < v_cutoff_date
    RETURNING *
  )
  INSERT INTO public.analytics_page_views_archive
  SELECT *, NOW() FROM moved_pv;
  GET DIAGNOSTICS v_page_views_count = ROW_COUNT;

  -- Archive funnel events
  WITH moved_fe AS (
    DELETE FROM public.analytics_funnel_events
    WHERE occurred_at < v_cutoff_date
    RETURNING *
  )
  INSERT INTO public.analytics_funnel_events_archive
  SELECT *, NOW() FROM moved_fe;
  GET DIAGNOSTICS v_funnel_events_count = ROW_COUNT;

  -- Archive sessions (after page views due to FK)
  WITH moved_sessions AS (
    DELETE FROM public.analytics_sessions
    WHERE started_at < v_cutoff_date
      AND NOT EXISTS (
        SELECT 1 FROM public.analytics_page_views pv
        WHERE pv.session_ref = analytics_sessions.id
      )
    RETURNING *
  )
  INSERT INTO public.analytics_sessions_archive
  SELECT *, NOW() FROM moved_sessions;
  GET DIAGNOSTICS v_sessions_count = ROW_COUNT;

  RETURN QUERY SELECT v_sessions_count, v_page_views_count, v_funnel_events_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.archive_old_analytics TO service_role;

-- ============================================================
-- AGGREGATE VIEWS FOR DASHBOARD
-- ============================================================

-- Daily page view summary
CREATE OR REPLACE VIEW public.analytics_daily_page_views AS
SELECT
  DATE_TRUNC('day', viewed_at) AS day,
  page_type,
  page_path,
  COUNT(*) AS view_count,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS unique_users,
  AVG(time_on_page_ms) FILTER (WHERE time_on_page_ms IS NOT NULL) AS avg_time_on_page_ms,
  AVG(scroll_depth_percent) FILTER (WHERE scroll_depth_percent IS NOT NULL) AS avg_scroll_depth
FROM public.analytics_page_views
WHERE viewed_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', viewed_at), page_type, page_path
ORDER BY day DESC, view_count DESC;

GRANT SELECT ON public.analytics_daily_page_views TO authenticated;

-- Funnel conversion summary by event
CREATE OR REPLACE VIEW public.analytics_funnel_summary AS
SELECT
  event_id,
  COUNT(*) FILTER (WHERE event_type = 'event_view') AS event_views,
  COUNT(*) FILTER (WHERE event_type = 'ticket_tier_view') AS ticket_tier_views,
  COUNT(*) FILTER (WHERE event_type = 'add_to_cart') AS add_to_carts,
  COUNT(*) FILTER (WHERE event_type = 'checkout_start') AS checkout_starts,
  COUNT(*) FILTER (WHERE event_type = 'checkout_complete') AS checkout_completes,
  COUNT(*) FILTER (WHERE event_type = 'checkout_abandon') AS checkout_abandons,
  COUNT(*) FILTER (WHERE event_type = 'cart_abandon') AS cart_abandons,
  SUM(value_cents) FILTER (WHERE event_type = 'checkout_complete') AS total_revenue_cents,
  AVG(time_since_event_view_ms) FILTER (WHERE event_type = 'checkout_complete') AS avg_time_to_purchase_ms
FROM public.analytics_funnel_events
WHERE occurred_at >= NOW() - INTERVAL '90 days'
GROUP BY event_id;

GRANT SELECT ON public.analytics_funnel_summary TO authenticated;

-- Performance summary
CREATE OR REPLACE VIEW public.analytics_performance_summary AS
SELECT
  DATE_TRUNC('day', recorded_at) AS day,
  metric_type,
  COUNT(*) AS sample_count,
  AVG(metric_value) AS avg_value,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metric_value) AS p50_value,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY metric_value) AS p75_value,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) AS p95_value,
  COUNT(*) FILTER (WHERE metric_rating = 'good') AS good_count,
  COUNT(*) FILTER (WHERE metric_rating = 'needs-improvement') AS needs_improvement_count,
  COUNT(*) FILTER (WHERE metric_rating = 'poor') AS poor_count
FROM public.analytics_performance
WHERE recorded_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', recorded_at), metric_type
ORDER BY day DESC, metric_type;

GRANT SELECT ON public.analytics_performance_summary TO authenticated;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE public.analytics_sessions IS 'User sessions for grouping page views and tracking user journeys';
COMMENT ON TABLE public.analytics_page_views IS 'Individual page view events with timing and scroll depth';
COMMENT ON TABLE public.analytics_funnel_events IS 'Conversion funnel tracking from event view to purchase';
COMMENT ON TABLE public.analytics_performance IS 'Web Vitals and API performance metrics';

COMMENT ON FUNCTION public.record_page_view IS 'Fire-and-forget function to record a page view';
COMMENT ON FUNCTION public.record_funnel_event IS 'Record conversion funnel event with automatic time calculations';
COMMENT ON FUNCTION public.record_performance_metric IS 'Record Web Vitals or API performance metric';
COMMENT ON FUNCTION public.update_page_view_duration IS 'Update page view with final time on page (called via beacon)';
COMMENT ON FUNCTION public.end_analytics_session IS 'Mark session as ended and calculate total duration';
COMMENT ON FUNCTION public.init_analytics_session IS 'Initialize or update a session with full UTM and device details';
COMMENT ON FUNCTION public.archive_old_analytics IS 'Archive analytics data older than retention period (default 90 days)';
