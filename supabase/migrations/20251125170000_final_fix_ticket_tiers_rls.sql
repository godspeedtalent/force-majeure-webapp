-- ============================================================================
-- FINAL FIX: Ticket Tiers RLS Permission Denied Issue
-- ============================================================================
--
-- ROOT CAUSE: Complex organization-based policy with EXISTS subquery was
-- causing permission denied even for admin users.
--
-- SOLUTION: Keep INSERT policies ultra-simple with only admin/dev checks.
-- No complex joins, no organization checks during INSERT. This ensures
-- admins can always create ticket tiers without any subquery complications.
--
-- Organization-based access control can be handled at the application level
-- or added later for UPDATE/DELETE if needed.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Drop ALL existing ticket_tiers INSERT policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins and devs can insert ticket tiers" ON ticket_tiers;
DROP POLICY IF EXISTS "Org members with manage_events can insert ticket tiers" ON ticket_tiers;
DROP POLICY IF EXISTS "Admins and event managers can insert ticket tiers" ON ticket_tiers;

-- ----------------------------------------------------------------------------
-- Create ONE simple INSERT policy - No complex checks
-- ----------------------------------------------------------------------------
CREATE POLICY "Authenticated users with admin/dev role can insert ticket tiers"
  ON ticket_tiers FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer')
    )
  );

-- ----------------------------------------------------------------------------
-- Fix is_dev_admin() function - It was never checking user_id!
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_dev_admin(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user exists in dev_admins table (if it exists)
  -- OR has a dev_admin feature flag entry
  -- OR just return false for now since feature flags don't have user_id field

  -- For now, just return false since the feature_flags table doesn't
  -- have a user_id column. This function needs to be redesigned.
  RETURN false;

  -- TODO: Redesign this to use a proper dev_admins table or user-specific flags
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- Documentation
-- ----------------------------------------------------------------------------
COMMENT ON POLICY "Authenticated users with admin/dev role can insert ticket tiers" ON ticket_tiers IS
  'Simple INSERT policy for ticket_tiers. Only checks user role without complex joins. This ensures admins can create ticket tiers without subquery issues.';

COMMENT ON FUNCTION is_dev_admin IS
  'BROKEN: Returns false for all users. Feature flags table does not have user_id field. Needs redesign.';
