-- ============================================================================
-- Fix signup timeout: Add missing GRANTs for pending_order_links table
-- ============================================================================
--
-- Problem: Account creation was timing out because the pending_order_links
-- table (created in 20260123900000_async_order_linking.sql) was missing
-- GRANT statements. While the link_orders_to_user() function uses SECURITY
-- DEFINER, Supabase still requires explicit GRANTs for table access.
--
-- This migration:
-- 1. Adds missing GRANTs for pending_order_links table
-- 2. Ensures the async link_orders_to_user function is properly defined
-- 3. Recreates the trigger to ensure it's using the async version
-- ============================================================================

-- ============================================================================
-- STEP 1: Add missing GRANTs for pending_order_links table
-- ============================================================================

-- Grant table access to authenticated users (needed for SECURITY DEFINER function)
GRANT INSERT, SELECT, UPDATE ON TABLE pending_order_links TO authenticated;

-- Grant full access to service_role (for Edge Function processing)
GRANT ALL ON TABLE pending_order_links TO service_role;

-- ============================================================================
-- STEP 2: Ensure the async link_orders_to_user function is properly defined
-- ============================================================================
-- This is idempotent (CREATE OR REPLACE) - ensures the async version is in place

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

-- ============================================================================
-- STEP 3: Recreate trigger to ensure it uses the async function
-- ============================================================================
-- Drop and recreate to be explicit about using the async version

DROP TRIGGER IF EXISTS trigger_link_orders_on_profile_create ON profiles;
CREATE TRIGGER trigger_link_orders_on_profile_create
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_orders_to_user();

-- ============================================================================
-- VERIFICATION NOTES
-- ============================================================================
-- After applying this migration:
-- 1. Test account creation - should complete in < 3 seconds
-- 2. Check pending_order_links table for new entries with status='pending'
-- 3. Verify no RLS/permission errors in Supabase logs
-- ============================================================================
