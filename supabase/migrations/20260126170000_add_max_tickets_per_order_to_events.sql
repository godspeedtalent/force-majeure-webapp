-- Migration: Add max_tickets_per_order column to events table
-- Business Logic Decision Q4: Per-event maximum ticket quantity
-- Approved: January 26, 2026
--
-- Purpose: Allow event organizers to set a maximum number of tickets
-- that can be purchased in a single order. This helps with:
-- - Fraud prevention (preventing bulk purchases by bots)
-- - Fair distribution (ensuring more people can attend)
-- - Inventory management (controlling how tickets are distributed)
--
-- Default: 100 tickets per order
-- Configurable: Each event can set their own limit

-- Add max_tickets_per_order column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS max_tickets_per_order INTEGER DEFAULT 100;

-- Add check constraint to ensure reasonable values
ALTER TABLE events
ADD CONSTRAINT max_tickets_per_order_positive
  CHECK (max_tickets_per_order IS NULL OR max_tickets_per_order > 0);

-- Add check constraint for reasonable maximum (10,000 tickets per order max)
ALTER TABLE events
ADD CONSTRAINT max_tickets_per_order_reasonable
  CHECK (max_tickets_per_order IS NULL OR max_tickets_per_order <= 10000);

-- Add comment for documentation
COMMENT ON COLUMN events.max_tickets_per_order IS
  'Maximum number of tickets that can be purchased in a single order for this event. Default: 100. NULL means no limit.';

-- Backfill existing events with default value
UPDATE events
SET max_tickets_per_order = 100
WHERE max_tickets_per_order IS NULL;
