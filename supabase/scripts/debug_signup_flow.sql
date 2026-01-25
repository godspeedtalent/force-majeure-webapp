-- ============================================================================
-- SIGNUP FLOW DIAGNOSTIC QUERIES
-- Run these in the Supabase SQL Editor to identify the timeout cause
-- ============================================================================

-- ============================================================================
-- 1. List ALL triggers on profiles table
-- ============================================================================
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- ============================================================================
-- 2. List ALL triggers on auth.users table
-- ============================================================================
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- ============================================================================
-- 3. Check if pending_order_links table exists and has correct grants
-- ============================================================================
SELECT
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'pending_order_links';

-- ============================================================================
-- 4. Check the current definition of link_orders_to_user function
-- ============================================================================
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'link_orders_to_user';

-- ============================================================================
-- 5. Check the current definition of handle_new_user function
-- ============================================================================
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ============================================================================
-- 6. Check for any activity_log triggers that might be slow
-- ============================================================================
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%activity%' OR trigger_name LIKE '%log%';

-- ============================================================================
-- 7. Test profile creation manually (will show if triggers cause timeout)
-- NOTE: This creates a test record - delete it after testing
-- ============================================================================
-- DO $$
-- DECLARE
--   test_id UUID := gen_random_uuid();
-- BEGIN
--   INSERT INTO profiles (id, user_id, email, display_name, created_at, updated_at)
--   VALUES (test_id, test_id, 'test-debug@example.com', 'Debug Test', NOW(), NOW());
--
--   RAISE NOTICE 'Profile created successfully with id: %', test_id;
--
--   -- Clean up
--   DELETE FROM profiles WHERE id = test_id;
--   RAISE NOTICE 'Test profile deleted';
-- END $$;

-- ============================================================================
-- 8. Check for long-running or blocked queries
-- ============================================================================
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state,
  wait_event_type,
  wait_event
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
  AND state != 'idle'
ORDER BY duration DESC;

-- ============================================================================
-- 9. Check RLS policies on profiles table
-- ============================================================================
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- ============================================================================
-- 10. Check if there are orphan orders that could trigger slow linking
-- ============================================================================
SELECT COUNT(*) as orphan_order_count
FROM orders
WHERE user_id IS NULL
  AND customer_email IS NOT NULL;
