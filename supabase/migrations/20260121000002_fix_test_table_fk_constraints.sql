-- ============================================
-- Fix Test Table Foreign Key Constraints
-- ============================================
-- Changes ON DELETE RESTRICT to ON DELETE CASCADE for ticket_tier_id
-- in test_order_items and test_tickets tables.
--
-- This allows event deletion to cascade properly through:
-- event → ticket_tiers → test_order_items/test_tickets
-- ============================================

-- ============================================
-- 1. Fix test_order_items FK constraint
-- ============================================

-- Drop the existing constraint
ALTER TABLE test_order_items
  DROP CONSTRAINT IF EXISTS test_order_items_ticket_tier_id_fkey;

-- Re-add with CASCADE
ALTER TABLE test_order_items
  ADD CONSTRAINT test_order_items_ticket_tier_id_fkey
  FOREIGN KEY (ticket_tier_id)
  REFERENCES ticket_tiers(id)
  ON DELETE CASCADE;

-- Also fix product_id constraint while we're here (change RESTRICT to CASCADE for consistency)
ALTER TABLE test_order_items
  DROP CONSTRAINT IF EXISTS test_order_items_product_id_fkey;

ALTER TABLE test_order_items
  ADD CONSTRAINT test_order_items_product_id_fkey
  FOREIGN KEY (product_id)
  REFERENCES products(id)
  ON DELETE CASCADE;

-- ============================================
-- 2. Fix test_tickets FK constraint
-- ============================================

-- Drop the existing constraint
ALTER TABLE test_tickets
  DROP CONSTRAINT IF EXISTS test_tickets_ticket_tier_id_fkey;

-- Re-add with CASCADE
ALTER TABLE test_tickets
  ADD CONSTRAINT test_tickets_ticket_tier_id_fkey
  FOREIGN KEY (ticket_tier_id)
  REFERENCES ticket_tiers(id)
  ON DELETE CASCADE;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE test_order_items IS 'Test order line items for mock data generation. FKs use CASCADE for easy cleanup.';
COMMENT ON TABLE test_tickets IS 'Test tickets for mock data generation. FKs use CASCADE for easy cleanup.';
