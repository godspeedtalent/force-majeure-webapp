-- ============================================================================
-- Migration: Make order linking asynchronous to fix signup 504 timeout
-- ============================================================================
--
-- Problem: The link_orders_to_user() trigger runs synchronously during signup,
-- causing 504 Gateway Timeout when:
-- - There are many orders to scan
-- - The orders/tickets UPDATE operations are slow
-- - Combined with other triggers (activity logging), exceeds Supabase timeout
--
-- Solution: Queue order linking requests in a table and process them async
-- via an Edge Function. This makes signup instant while deferring heavy work.
-- ============================================================================

-- ============================================================================
-- STEP 1: Create pending_order_links table to queue linking requests
-- ============================================================================

CREATE TABLE IF NOT EXISTS pending_order_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  orders_linked INTEGER DEFAULT 0,
  tickets_updated INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE(user_id) -- Only one pending request per user
);

-- Index for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_pending_order_links_status
ON pending_order_links(status, created_at)
WHERE status = 'pending';

-- RLS: Only service role can access (Edge Function uses service role)
ALTER TABLE pending_order_links ENABLE ROW LEVEL SECURITY;

-- Allow admins/developers to view for debugging
CREATE POLICY "Admins can view pending order links"
  ON pending_order_links FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));

-- Service role bypass for Edge Function
CREATE POLICY "Service role can manage pending order links"
  ON pending_order_links FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE pending_order_links IS
  'Queue for async order linking. Populated during signup, processed by Edge Function.';

-- ============================================================================
-- STEP 2: Replace synchronous trigger with async queue insert
-- ============================================================================

CREATE OR REPLACE FUNCTION link_orders_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue if user has an email (linking needed)
  IF NEW.email IS NOT NULL THEN
    -- Insert into queue for async processing
    -- ON CONFLICT handles race condition if trigger fires multiple times
    INSERT INTO pending_order_links (user_id, email, status)
    VALUES (NEW.id, LOWER(NEW.email), 'pending')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION link_orders_to_user() IS
  'Queues order linking for async processing. Replaces synchronous UPDATE.';

-- ============================================================================
-- STEP 3: Create function for Edge Function to call
-- ============================================================================

CREATE OR REPLACE FUNCTION process_pending_order_link(link_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_link RECORD;
  v_orders_updated INTEGER := 0;
  v_tickets_updated INTEGER := 0;
BEGIN
  -- Get and lock the pending link
  SELECT * INTO v_link
  FROM pending_order_links
  WHERE id = link_id AND status = 'pending'
  FOR UPDATE SKIP LOCKED;

  IF v_link IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Link not found or already processing'
    );
  END IF;

  -- Mark as processing
  UPDATE pending_order_links
  SET status = 'processing'
  WHERE id = link_id;

  -- Link orders
  UPDATE orders
  SET user_id = v_link.user_id,
      updated_at = NOW()
  WHERE customer_email = v_link.email
    AND user_id IS NULL;

  GET DIAGNOSTICS v_orders_updated = ROW_COUNT;

  -- Update tickets for linked orders
  IF v_orders_updated > 0 THEN
    UPDATE tickets t
    SET updated_at = NOW()
    FROM orders o
    WHERE t.order_id = o.id
      AND o.user_id = v_link.user_id
      AND o.customer_email = v_link.email;

    GET DIAGNOSTICS v_tickets_updated = ROW_COUNT;
  END IF;

  -- Mark as completed
  UPDATE pending_order_links
  SET status = 'completed',
      orders_linked = v_orders_updated,
      tickets_updated = v_tickets_updated,
      processed_at = NOW()
  WHERE id = link_id;

  -- Log if orders were linked
  IF v_orders_updated > 0 THEN
    RAISE LOG 'Linked % orders and % tickets to user % with email %',
      v_orders_updated, v_tickets_updated, v_link.user_id, v_link.email;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'orders_linked', v_orders_updated,
    'tickets_updated', v_tickets_updated,
    'user_id', v_link.user_id
  );

EXCEPTION WHEN OTHERS THEN
  -- Mark as failed with error
  UPDATE pending_order_links
  SET status = 'failed',
      error_message = SQLERRM,
      processed_at = NOW()
  WHERE id = link_id;

  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_pending_order_link(UUID) IS
  'Process a single pending order link. Called by Edge Function.';

-- ============================================================================
-- STEP 4: Create function to process all pending links (batch)
-- ============================================================================

CREATE OR REPLACE FUNCTION process_all_pending_order_links(batch_size INTEGER DEFAULT 100)
RETURNS JSONB AS $$
DECLARE
  v_link RECORD;
  v_results JSONB := '[]'::jsonb;
  v_result JSONB;
  v_processed INTEGER := 0;
BEGIN
  FOR v_link IN
    SELECT id FROM pending_order_links
    WHERE status = 'pending'
    ORDER BY created_at
    LIMIT batch_size
  LOOP
    v_result := process_pending_order_link(v_link.id);
    v_results := v_results || v_result;
    v_processed := v_processed + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'processed', v_processed,
    'results', v_results
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_all_pending_order_links(INTEGER) IS
  'Process batch of pending order links. Can be called by cron or Edge Function.';

-- Grant execute to authenticated (for admin tools)
GRANT EXECUTE ON FUNCTION process_pending_order_link(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION process_all_pending_order_links(INTEGER) TO authenticated;

-- ============================================================================
-- STEP 5: Cleanup - remove old completed/failed records after 7 days
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_order_links()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM pending_order_links
  WHERE status IN ('completed', 'failed')
    AND processed_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_order_links() IS
  'Remove old completed/failed order link records. Call periodically.';

-- ============================================================================
-- STEP 6: Process any existing profiles that might have orphan orders
-- ============================================================================
-- This handles users who signed up before this migration
-- Only queue if they might have orphan orders matching their email

INSERT INTO pending_order_links (user_id, email, status)
SELECT DISTINCT p.id, LOWER(p.email), 'pending'
FROM profiles p
WHERE p.email IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.customer_email = LOWER(p.email)
      AND o.user_id IS NULL
  )
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- STEP 7: Set up pg_cron for automatic processing (if pg_cron extension available)
-- ============================================================================
-- Note: pg_cron may not be available on all Supabase plans.
-- If not available, use the Edge Function with Supabase cron or external scheduler.

-- Check if pg_cron is available and schedule job
DO $outer$
BEGIN
  -- Only create if pg_cron extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove existing job if any
    PERFORM cron.unschedule('process-pending-order-links');

    -- Schedule job to run every minute
    PERFORM cron.schedule(
      'process-pending-order-links',
      '* * * * *',
      'SELECT process_all_pending_order_links(50)'
    );

    RAISE NOTICE 'pg_cron job scheduled: process-pending-order-links (every minute)';
  ELSE
    RAISE NOTICE 'pg_cron not available. Use Edge Function webhook or external scheduler.';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not set up pg_cron: %. Use Edge Function instead.', SQLERRM;
END;
$outer$;

-- ============================================================================
-- WEBHOOK SETUP INSTRUCTIONS
-- ============================================================================
-- To set up real-time processing via webhook:
--
-- 1. Go to Supabase Dashboard > Database > Webhooks
-- 2. Create new webhook:
--    - Name: process-order-links
--    - Table: pending_order_links
--    - Events: INSERT
--    - Type: Supabase Edge Function
--    - Function: process-order-links
--    - Headers: (none needed, uses service role)
--
-- Alternatively, set up external cron (e.g., via Supabase cron jobs in Dashboard):
-- - URL: https://<project>.supabase.co/functions/v1/process-order-links
-- - Schedule: Every 1 minute
-- - Method: POST
-- - Headers: Authorization: Bearer <service_role_key>
-- ============================================================================
