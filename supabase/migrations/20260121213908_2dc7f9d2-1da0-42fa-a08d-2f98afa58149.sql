-- ============================================================================
-- Secure guests table: Remove public read access, add RPC for counting
-- ============================================================================

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Guests are readable for guest list display" ON guests;

-- Create a more restrictive policy: guests can only be read by:
-- 1. Admins/developers
-- 2. The guest themselves (via email match through service role)
-- 3. Authenticated users who made the order (via orders table relationship)

-- Keep the admin policy (already exists)
-- Keep the "Anyone can create guests" policy for checkout flow

-- Create a policy for authenticated users to read guests from their own orders
CREATE POLICY "Users can read guests from their orders"
  ON guests FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT guest_id FROM orders 
      WHERE user_id = auth.uid() 
      AND guest_id IS NOT NULL
    )
  );

-- Create secure RPC function for public guest count (aggregate only, no PII)
-- This function only returns a count, never individual guest data
CREATE OR REPLACE FUNCTION get_event_guest_count(event_id_param uuid)
RETURNS integer
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT g.id)::integer
  FROM guests g
  INNER JOIN orders o ON o.guest_id = g.id
  WHERE o.event_id = event_id_param
  AND o.status = 'completed';
$$;

-- Grant execute to anon and authenticated for the guest count function
GRANT EXECUTE ON FUNCTION get_event_guest_count(uuid) TO anon, authenticated;

-- Also ensure the existing get_event_guest_order_count works correctly
-- (it may already exist but let's ensure it's secure)
CREATE OR REPLACE FUNCTION get_event_guest_order_count(event_id_param uuid)
RETURNS integer
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM orders
  WHERE event_id = event_id_param
  AND status = 'completed'
  AND guest_id IS NOT NULL;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_event_guest_order_count(uuid) TO anon, authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_event_guest_count(uuid) IS 'Returns count of unique guests with completed orders for an event. No PII exposed.';
COMMENT ON FUNCTION get_event_guest_order_count(uuid) IS 'Returns count of completed orders from guests for an event. No PII exposed.';