-- ============================================================================
-- FIX GUESTS TABLE RLS POLICIES
-- 
-- Problem: Guest PII (emails, names, addresses) is publicly readable
-- Solution: Restrict access to owners, order owners, and admins only
-- Guest creation during checkout works via edge functions using service role
-- ============================================================================

-- First, revoke anonymous SELECT access - they should not read guest data
REVOKE SELECT ON guests FROM anon;

-- Keep INSERT for anon but we'll restrict it via policy
-- Edge functions use service_role which bypasses RLS anyway

-- ============================================================================
-- DROP ALL EXISTING GUEST POLICIES (clean slate)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all guests" ON guests;
DROP POLICY IF EXISTS "Users can view own guest records" ON guests;
DROP POLICY IF EXISTS "Anyone can create guests" ON guests;
DROP POLICY IF EXISTS "Guests are readable for guest list display" ON guests;
DROP POLICY IF EXISTS "Authenticated users can view own guests" ON guests;
DROP POLICY IF EXISTS "Users can view guests from their orders" ON guests;

-- ============================================================================
-- NEW RESTRICTIVE RLS POLICIES
-- ============================================================================

-- 1. Admins and developers have full access
CREATE POLICY "Admins can manage all guests"
  ON guests FOR ALL
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

-- 2. Authenticated users can view their own guest records (linked via profile_id)
CREATE POLICY "Users can view own guest records"
  ON guests FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- 3. Authenticated users can view guests from orders they own
-- This allows viewing guest info on their own order confirmations
CREATE POLICY "Users can view guests from their orders"
  ON guests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.guest_id = guests.id
      AND o.user_id = auth.uid()
    )
  );

-- 4. Authenticated users can update their own guest records
CREATE POLICY "Users can update own guest records"
  ON guests FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- 5. NO anonymous SELECT policy - anon cannot read any guest data
-- Guest list counts are handled via secure RPC functions (get_event_guest_count)

-- 6. Guest creation policy - only allow from edge functions (service role)
-- Service role bypasses RLS, so we deny all direct client inserts
-- This prevents attackers from creating fake guest records
CREATE POLICY "Guests can only be created by system processes"
  ON guests FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only admins can directly insert via client
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Deny anon INSERT - they must go through checkout edge function
-- Remove the grant we had earlier
REVOKE INSERT ON guests FROM anon;

-- ============================================================================
-- VERIFY: service_role still has full access (it bypasses RLS by default)
-- Edge functions using service role client can still create guests
-- ============================================================================

COMMENT ON TABLE guests IS 'Guest checkout data - PII protected. Guest creation during checkout must go through edge functions using service role.';