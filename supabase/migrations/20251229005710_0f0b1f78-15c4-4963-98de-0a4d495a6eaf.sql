-- Fix PUBLIC_DATA_EXPOSURE: Restrict event_views table to admins only
-- The table currently exposes IP addresses, user agents, and session IDs publicly

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Event views are publicly viewable" ON event_views;

-- Create admin-only SELECT policy
CREATE POLICY "Admins can view event analytics"
  ON event_views FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'developer')
    )
  );

-- Note: The get_event_view_count RPC function still works for public count access
-- since it's SECURITY DEFINER and only returns aggregate count, not raw PII data