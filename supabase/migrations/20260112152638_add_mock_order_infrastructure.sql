-- ============================================
-- Mock Order Infrastructure Migration
-- ============================================
-- Adds support for mock order generation:
-- 1. test_data column on orders table
-- 2. 'test' status for events
-- 3. Cleanup function for atomic deletion
-- ============================================

-- ============================================
-- 1. Add test_data column to orders table
-- ============================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS test_data BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_orders_test_data ON orders(test_data);

COMMENT ON COLUMN orders.test_data IS 'Indicates if this order was generated as test/mock data';

-- ============================================
-- 2. Update event status constraint to include 'test'
-- ============================================

-- Drop existing constraint if it exists
DO $$
BEGIN
  -- Try to drop the constraint - it may not exist or have different name
  ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Constraint doesn't exist, continue
END $$;

-- Add new constraint with 'test' status
ALTER TABLE events
ADD CONSTRAINT events_status_check
CHECK (status IN ('draft', 'published', 'invisible', 'test'));

-- ============================================
-- 3. Create cleanup function for atomic deletion
-- ============================================

CREATE OR REPLACE FUNCTION delete_mock_orders_by_event(p_event_id UUID)
RETURNS TABLE (
  deleted_tickets INTEGER,
  deleted_order_items INTEGER,
  deleted_orders INTEGER,
  deleted_guests INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_tickets INTEGER := 0;
  v_deleted_order_items INTEGER := 0;
  v_deleted_orders INTEGER := 0;
  v_deleted_guests INTEGER := 0;
  v_order_ids UUID[];
  v_guest_ids UUID[];
BEGIN
  -- Get all mock order IDs for this event
  SELECT ARRAY_AGG(id) INTO v_order_ids
  FROM orders
  WHERE event_id = p_event_id AND test_data = true;

  -- If no mock orders found, return zeros
  IF v_order_ids IS NULL OR array_length(v_order_ids, 1) IS NULL THEN
    RETURN QUERY SELECT 0, 0, 0, 0;
    RETURN;
  END IF;

  -- Get guest IDs that were created for these orders (only orphaned guests)
  -- Only delete guests that don't have any non-mock orders
  SELECT ARRAY_AGG(DISTINCT o.guest_id) INTO v_guest_ids
  FROM orders o
  WHERE o.id = ANY(v_order_ids)
    AND o.guest_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM orders o2
      WHERE o2.guest_id = o.guest_id
        AND o2.id != o.id
        AND o2.test_data = false
    );

  -- Delete tickets first (FK to orders)
  DELETE FROM tickets WHERE order_id = ANY(v_order_ids);
  GET DIAGNOSTICS v_deleted_tickets = ROW_COUNT;

  -- Delete order items
  DELETE FROM order_items WHERE order_id = ANY(v_order_ids);
  GET DIAGNOSTICS v_deleted_order_items = ROW_COUNT;

  -- Delete orders
  DELETE FROM orders WHERE id = ANY(v_order_ids);
  GET DIAGNOSTICS v_deleted_orders = ROW_COUNT;

  -- Delete orphaned guests (if any)
  IF v_guest_ids IS NOT NULL AND array_length(v_guest_ids, 1) > 0 THEN
    DELETE FROM guests WHERE id = ANY(v_guest_ids);
    GET DIAGNOSTICS v_deleted_guests = ROW_COUNT;
  END IF;

  RETURN QUERY SELECT v_deleted_tickets, v_deleted_order_items, v_deleted_orders, v_deleted_guests;
END;
$$;

-- Grant execute to authenticated users (RLS will handle permission checks)
GRANT EXECUTE ON FUNCTION delete_mock_orders_by_event(UUID) TO authenticated;

-- ============================================
-- 4. Add test_data column to tickets table (for filtering)
-- ============================================
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS test_data BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_tickets_test_data ON tickets(test_data);

COMMENT ON COLUMN tickets.test_data IS 'Indicates if this ticket was generated as test/mock data';
