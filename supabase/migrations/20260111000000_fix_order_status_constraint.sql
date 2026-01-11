-- ============================================================================
-- Migration: Expand Order Status Constraint
-- ============================================================================
-- Adds 'completed' and 'failed' status values to the orders table
-- to align with TypeScript OrderStatus type.
--
-- Current statuses: pending, paid, refunded, cancelled
-- New statuses: completed, failed
-- ============================================================================

-- Drop existing constraint and add expanded one
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'completed', 'refunded', 'cancelled', 'failed'));

-- Add comment documenting status meanings
COMMENT ON COLUMN orders.status IS
  'Order status: pending (awaiting payment), paid (payment received), completed (fulfilled), refunded (money returned), cancelled (order cancelled), failed (payment failed)';
