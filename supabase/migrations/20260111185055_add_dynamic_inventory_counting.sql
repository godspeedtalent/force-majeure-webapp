-- Migration: Add dynamic inventory counting
-- This replaces the fragile counter-based approach with accurate ticket counting
--
-- The previous approach stored sold_inventory as a counter that was incremented/decremented
-- during imports and rollbacks. This was prone to race conditions and drift.
--
-- This migration adds:
-- 1. A function to calculate accurate inventory stats for a ticket tier
-- 2. A view that provides inventory stats for all tiers
-- 3. A function to recalculate and sync the stored counters (for backwards compatibility)

-- ============================================================================
-- Function: get_tier_inventory_stats
-- Returns accurate inventory counts for a single ticket tier by counting tickets
-- ============================================================================
CREATE OR REPLACE FUNCTION get_tier_inventory_stats(p_tier_id UUID)
RETURNS TABLE (
  tier_id UUID,
  total_tickets INTEGER,
  sold_count INTEGER,
  reserved_count INTEGER,
  available_count INTEGER,
  pending_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tt.id as tier_id,
    tt.total_tickets,
    -- Count tickets that are sold (valid or scanned status)
    COALESCE(
      (SELECT COUNT(*)::INTEGER
       FROM tickets t
       WHERE t.ticket_tier_id = tt.id
       AND t.status IN ('valid', 'scanned')),
      0
    ) as sold_count,
    -- Reserved inventory (still stored as a counter for now)
    COALESCE(tt.reserved_inventory, 0) as reserved_count,
    -- Available = total - sold - reserved
    GREATEST(0,
      tt.total_tickets
      - COALESCE(
          (SELECT COUNT(*)::INTEGER
           FROM tickets t
           WHERE t.ticket_tier_id = tt.id
           AND t.status IN ('valid', 'scanned')),
          0
        )
      - COALESCE(tt.reserved_inventory, 0)
    ) as available_count,
    -- Pending tickets (orders in progress)
    COALESCE(
      (SELECT COUNT(*)::INTEGER
       FROM tickets t
       WHERE t.ticket_tier_id = tt.id
       AND t.status = 'pending'),
      0
    ) as pending_count
  FROM ticket_tiers tt
  WHERE tt.id = p_tier_id;
END;
$$;

-- ============================================================================
-- Function: get_event_inventory_stats
-- Returns accurate inventory counts for all tiers of an event
-- ============================================================================
CREATE OR REPLACE FUNCTION get_event_inventory_stats(p_event_id UUID)
RETURNS TABLE (
  tier_id UUID,
  tier_name TEXT,
  price_cents INTEGER,
  total_tickets INTEGER,
  sold_count INTEGER,
  reserved_count INTEGER,
  available_count INTEGER,
  pending_count INTEGER,
  is_active BOOLEAN,
  tier_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tt.id as tier_id,
    tt.name as tier_name,
    tt.price_cents,
    tt.total_tickets,
    -- Count tickets that are sold (valid or scanned status)
    COALESCE(
      (SELECT COUNT(*)::INTEGER
       FROM tickets t
       WHERE t.ticket_tier_id = tt.id
       AND t.status IN ('valid', 'scanned')),
      0
    ) as sold_count,
    -- Reserved inventory
    COALESCE(tt.reserved_inventory, 0) as reserved_count,
    -- Available = total - sold - reserved
    GREATEST(0,
      tt.total_tickets
      - COALESCE(
          (SELECT COUNT(*)::INTEGER
           FROM tickets t
           WHERE t.ticket_tier_id = tt.id
           AND t.status IN ('valid', 'scanned')),
          0
        )
      - COALESCE(tt.reserved_inventory, 0)
    ) as available_count,
    -- Pending tickets
    COALESCE(
      (SELECT COUNT(*)::INTEGER
       FROM tickets t
       WHERE t.ticket_tier_id = tt.id
       AND t.status = 'pending'),
      0
    ) as pending_count,
    tt.is_active,
    tt.tier_order
  FROM ticket_tiers tt
  WHERE tt.event_id = p_event_id
  ORDER BY tt.tier_order, tt.created_at;
END;
$$;

-- ============================================================================
-- Function: sync_tier_inventory_counters
-- Recalculates and syncs the stored counters with actual ticket counts
-- Use this to fix any drift in the stored counters
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_tier_inventory_counters(p_tier_id UUID DEFAULT NULL)
RETURNS TABLE (
  tier_id UUID,
  old_sold INTEGER,
  new_sold INTEGER,
  old_available INTEGER,
  new_available INTEGER,
  was_updated BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH tier_stats AS (
    SELECT
      tt.id,
      tt.sold_inventory as old_sold,
      tt.available_inventory as old_available,
      tt.total_tickets,
      tt.reserved_inventory,
      COALESCE(
        (SELECT COUNT(*)::INTEGER
         FROM tickets t
         WHERE t.ticket_tier_id = tt.id
         AND t.status IN ('valid', 'scanned')),
        0
      ) as actual_sold
    FROM ticket_tiers tt
    WHERE p_tier_id IS NULL OR tt.id = p_tier_id
  ),
  updates AS (
    UPDATE ticket_tiers tt
    SET
      sold_inventory = ts.actual_sold,
      available_inventory = GREATEST(0, ts.total_tickets - ts.actual_sold - COALESCE(ts.reserved_inventory, 0))
    FROM tier_stats ts
    WHERE tt.id = ts.id
    AND (
      tt.sold_inventory IS DISTINCT FROM ts.actual_sold
      OR tt.available_inventory IS DISTINCT FROM GREATEST(0, ts.total_tickets - ts.actual_sold - COALESCE(ts.reserved_inventory, 0))
    )
    RETURNING tt.id as updated_id
  )
  SELECT
    ts.id as tier_id,
    ts.old_sold,
    ts.actual_sold as new_sold,
    ts.old_available,
    GREATEST(0, ts.total_tickets - ts.actual_sold - COALESCE(ts.reserved_inventory, 0)) as new_available,
    EXISTS(SELECT 1 FROM updates u WHERE u.updated_id = ts.id) as was_updated
  FROM tier_stats ts;
END;
$$;

-- ============================================================================
-- Function: sync_event_inventory_counters
-- Syncs all tier counters for a specific event
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_event_inventory_counters(p_event_id UUID)
RETURNS TABLE (
  tier_id UUID,
  tier_name TEXT,
  old_sold INTEGER,
  new_sold INTEGER,
  old_available INTEGER,
  new_available INTEGER,
  was_updated BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH tier_stats AS (
    SELECT
      tt.id,
      tt.name,
      tt.sold_inventory as old_sold,
      tt.available_inventory as old_available,
      tt.total_tickets,
      tt.reserved_inventory,
      COALESCE(
        (SELECT COUNT(*)::INTEGER
         FROM tickets t
         WHERE t.ticket_tier_id = tt.id
         AND t.status IN ('valid', 'scanned')),
        0
      ) as actual_sold
    FROM ticket_tiers tt
    WHERE tt.event_id = p_event_id
  ),
  updates AS (
    UPDATE ticket_tiers tt
    SET
      sold_inventory = ts.actual_sold,
      available_inventory = GREATEST(0, ts.total_tickets - ts.actual_sold - COALESCE(ts.reserved_inventory, 0))
    FROM tier_stats ts
    WHERE tt.id = ts.id
    AND (
      tt.sold_inventory IS DISTINCT FROM ts.actual_sold
      OR tt.available_inventory IS DISTINCT FROM GREATEST(0, ts.total_tickets - ts.actual_sold - COALESCE(ts.reserved_inventory, 0))
    )
    RETURNING tt.id as updated_id
  )
  SELECT
    ts.id as tier_id,
    ts.name as tier_name,
    ts.old_sold,
    ts.actual_sold as new_sold,
    ts.old_available,
    GREATEST(0, ts.total_tickets - ts.actual_sold - COALESCE(ts.reserved_inventory, 0)) as new_available,
    EXISTS(SELECT 1 FROM updates u WHERE u.updated_id = ts.id) as was_updated
  FROM tier_stats ts;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_tier_inventory_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_inventory_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_tier_inventory_counters(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_event_inventory_counters(UUID) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION get_tier_inventory_stats IS 'Returns accurate inventory counts for a ticket tier by counting actual tickets. Use this instead of reading sold_inventory directly.';
COMMENT ON FUNCTION get_event_inventory_stats IS 'Returns accurate inventory counts for all tiers of an event by counting actual tickets.';
COMMENT ON FUNCTION sync_tier_inventory_counters IS 'Recalculates and syncs stored inventory counters with actual ticket counts. Call with NULL to sync all tiers, or pass a tier_id to sync a specific tier.';
COMMENT ON FUNCTION sync_event_inventory_counters IS 'Syncs all tier inventory counters for a specific event.';
