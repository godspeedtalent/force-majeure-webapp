-- ============================================================================
-- Migration: Guest Order RLS Helper Function
-- ============================================================================
-- Adds a helper function for checking order access that handles both
-- authenticated user orders and guest orders.
--
-- Note: Current RLS policies are sufficient because:
-- 1. Admins can access all orders (including guest orders)
-- 2. Users access their own orders (user_id = auth.uid())
-- 3. Guest orders are created/accessed via service role during checkout
--
-- This helper function is provided for future use cases where we need
-- more granular guest order access control.
-- ============================================================================

-- Create a function to check if the current user can access an order
-- Handles both authenticated user orders and admin access to guest orders
CREATE OR REPLACE FUNCTION can_access_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_guest_id UUID;
BEGIN
  -- Get the order's user_id and guest_id
  SELECT user_id, guest_id
  INTO v_user_id, v_guest_id
  FROM orders
  WHERE id = p_order_id;

  -- If order not found, deny access
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- If order has a user_id and it matches current user, allow access
  IF v_user_id IS NOT NULL AND v_user_id = auth.uid() THEN
    RETURN TRUE;
  END IF;

  -- Admin/developer check - they can access all orders including guest orders
  IF auth.uid() IS NOT NULL THEN
    -- Check for admin or developer role
    IF EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'developer')
    ) THEN
      RETURN TRUE;
    END IF;

    -- Also check the is_dev_admin function if it exists
    IF is_dev_admin(auth.uid()) THEN
      RETURN TRUE;
    END IF;
  END IF;

  -- For guest orders without matching user, access is denied at RLS level
  -- Guest order viewing is handled through secure email links (service role)
  RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION can_access_order(UUID) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION can_access_order(UUID) IS
  'Checks if the current user can access an order. Returns TRUE if user owns the order or is an admin/developer.';
