-- ============================================================================
-- SECURITY FIX: Promo Codes Should Not Be Publicly Viewable
-- ============================================================================
-- Issue: The "Promo codes are publicly viewable" policy allows anyone
--        (including anonymous users) to list/browse all active promo codes.
--        This is a security vulnerability - users should NOT be able to
--        discover promo codes by browsing. They should only validate codes
--        they explicitly enter.
--
-- Fix:
--   1. Remove public SELECT policy
--   2. Only allow admins and event managers to view promo codes
--   3. Create a secure RPC function for code validation
--
-- Note: promo_codes links to events via the event_promo_codes junction table
--       (promo_codes does NOT have an event_id column)
--
-- Created: 2026-01-25
-- ============================================================================

-- Drop the problematic public SELECT policy
DROP POLICY IF EXISTS "Promo codes are publicly viewable" ON promo_codes;

-- ============================================================================
-- NEW POLICIES: Restrict promo code visibility
-- ============================================================================

-- 1. Admins can view all promo codes
CREATE POLICY "Admins can view all promo codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    is_dev_admin(auth.uid())
  );

-- 2. Event managers can view promo codes for their events (via junction table)
CREATE POLICY "Event managers can view event promo codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT epc.promo_code_id
      FROM event_promo_codes epc
      JOIN events e ON e.id = epc.event_id
      WHERE is_event_manager(auth.uid(), e.id)
    )
  );

-- 3. Organization admins can view promo codes for their org's events (via junction table)
CREATE POLICY "Org admins can view org event promo codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT epc.promo_code_id
      FROM event_promo_codes epc
      JOIN events e ON e.id = epc.event_id
      JOIN organizations o ON e.organization_id = o.id
      WHERE is_organization_admin(auth.uid(), o.id)
    )
  );

-- ============================================================================
-- SECURE PROMO CODE VALIDATION FUNCTION
-- ============================================================================
-- Users validate codes by calling this function, NOT by querying the table.
-- This function:
--   1. Looks up the code without exposing other codes
--   2. Validates it's active and not expired
--   3. Checks if the code is linked to the specified event (or is global)
--   4. Returns only the necessary discount info

CREATE OR REPLACE FUNCTION validate_promo_code(
  p_code TEXT,
  p_event_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo_code promo_codes%ROWTYPE;
  v_is_linked BOOLEAN;
  v_result JSONB;
BEGIN
  -- Input validation
  IF p_code IS NULL OR trim(p_code) = '' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Code is required'
    );
  END IF;

  IF p_event_id IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Event ID is required'
    );
  END IF;

  -- Find the promo code (case-insensitive)
  SELECT * INTO v_promo_code
  FROM promo_codes
  WHERE UPPER(code) = UPPER(trim(p_code))
  LIMIT 1;

  -- Code not found
  IF v_promo_code IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid code'
    );
  END IF;

  -- Check if code is linked to this event (or has no event links = global code)
  SELECT EXISTS (
    SELECT 1 FROM event_promo_codes
    WHERE promo_code_id = v_promo_code.id
      AND event_id = p_event_id
  ) OR NOT EXISTS (
    -- If code has NO event links at all, it's a global code
    SELECT 1 FROM event_promo_codes
    WHERE promo_code_id = v_promo_code.id
  ) INTO v_is_linked;

  IF NOT v_is_linked THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Code not valid for this event'
    );
  END IF;

  -- Check if active
  IF NOT v_promo_code.is_active THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Code is no longer active'
    );
  END IF;

  -- Check expiration
  IF v_promo_code.expires_at IS NOT NULL AND v_promo_code.expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Code has expired'
    );
  END IF;

  -- Code is valid - return discount info
  v_result := jsonb_build_object(
    'valid', true,
    'code_id', v_promo_code.id,
    'code', v_promo_code.code,
    'discount_type', v_promo_code.discount_type,
    'discount_value', v_promo_code.discount_value
  );

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users and anonymous
-- (checkout may start before login)
GRANT EXECUTE ON FUNCTION validate_promo_code(TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION validate_promo_code(TEXT, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION validate_promo_code IS
'Validates a promo code for an event. Returns discount info if valid.
Users should call this function instead of querying promo_codes directly.
Checks if code is linked to the event via event_promo_codes junction table.
Global codes (not linked to any event) are valid for all events.
SECURITY DEFINER bypasses RLS to check the code without exposing others.';
