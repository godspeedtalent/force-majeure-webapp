-- ============================================================================
-- Restrict analytics_sessions table to admins and developers only
-- This protects sensitive user data like IP addresses, user agents, and browsing behavior
-- ============================================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can view analytics sessions" ON analytics_sessions;
DROP POLICY IF EXISTS "Analytics sessions are publicly readable" ON analytics_sessions;
DROP POLICY IF EXISTS "Public can view analytics sessions" ON analytics_sessions;

-- Create admin/developer-only SELECT policy
CREATE POLICY "Only admins and developers can view analytics sessions"
  ON analytics_sessions FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Ensure INSERT is still allowed for tracking (but only authenticated users can insert their own)
DROP POLICY IF EXISTS "Anyone can insert analytics sessions" ON analytics_sessions;
DROP POLICY IF EXISTS "Users can insert analytics sessions" ON analytics_sessions;

CREATE POLICY "Authenticated users can insert their own analytics sessions"
  ON analytics_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Allow anonymous users to insert sessions (for tracking before login)
CREATE POLICY "Anonymous users can insert analytics sessions"
  ON analytics_sessions FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Only admins can update/delete analytics data
DROP POLICY IF EXISTS "Anyone can update analytics sessions" ON analytics_sessions;
DROP POLICY IF EXISTS "Users can update analytics sessions" ON analytics_sessions;

CREATE POLICY "Only admins can update analytics sessions"
  ON analytics_sessions FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

CREATE POLICY "Only admins can delete analytics sessions"
  ON analytics_sessions FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Add comment explaining the security model
COMMENT ON TABLE analytics_sessions IS 
  'Analytics session data containing sensitive information (IP addresses, user agents, browsing patterns). Read access restricted to admins and developers only. Insert allowed for tracking purposes.';

-- ============================================================================
-- Also secure related analytics tables with the same pattern
-- ============================================================================

-- analytics_page_views
DROP POLICY IF EXISTS "Anyone can view analytics page views" ON analytics_page_views;
DROP POLICY IF EXISTS "Public can view analytics page views" ON analytics_page_views;

CREATE POLICY "Only admins and developers can view analytics page views"
  ON analytics_page_views FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- analytics_performance
DROP POLICY IF EXISTS "Anyone can view analytics performance" ON analytics_performance;
DROP POLICY IF EXISTS "Public can view analytics performance" ON analytics_performance;

CREATE POLICY "Only admins and developers can view analytics performance"
  ON analytics_performance FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- analytics_funnel_events
DROP POLICY IF EXISTS "Anyone can view analytics funnel events" ON analytics_funnel_events;
DROP POLICY IF EXISTS "Public can view analytics funnel events" ON analytics_funnel_events;

CREATE POLICY "Only admins and developers can view analytics funnel events"
  ON analytics_funnel_events FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );