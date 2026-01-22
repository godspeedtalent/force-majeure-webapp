-- ============================================================================
-- Allow public access to invisible events via direct URL
-- This enables "unlisted" event functionality where events are hidden from
-- listings but still accessible if someone has the direct link
-- ============================================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Published events are publicly viewable" ON events;

-- Create new policy that allows public access to both published and invisible events
-- Note: Draft and test events remain restricted to privileged users only
DROP POLICY IF EXISTS "Published and invisible events are publicly viewable" ON events;
CREATE POLICY "Published and invisible events are publicly viewable"
  ON events FOR SELECT
  TO anon, authenticated
  USING (status IN ('published', 'invisible'));

-- Add comment explaining the policy
COMMENT ON POLICY "Published and invisible events are publicly viewable" ON events IS 
  'Allows public read access to published events (shown in listings) and invisible events (unlisted but accessible via direct URL). Draft and test events remain restricted to privileged users.';