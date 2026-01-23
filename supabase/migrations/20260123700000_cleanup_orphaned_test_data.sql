-- Migration: Clean up orphaned test data from deleted events
-- This handles legacy test_data=true records in production tables
-- where the parent event no longer exists, as well as orphaned records
-- in the newer test_* tables.

-- Delete orphaned test tickets (production table with test_data flag)
DELETE FROM tickets t
USING orders o
WHERE t.order_id = o.id
AND o.test_data = true
AND NOT EXISTS (SELECT 1 FROM events e WHERE e.id = o.event_id);

-- Delete orphaned test order_items (production table)
DELETE FROM order_items oi
USING orders o
WHERE oi.order_id = o.id
AND o.test_data = true
AND NOT EXISTS (SELECT 1 FROM events e WHERE e.id = o.event_id);

-- Delete orphaned test orders (production table with test_data flag)
DELETE FROM orders o
WHERE o.test_data = true
AND NOT EXISTS (SELECT 1 FROM events e WHERE e.id = o.event_id);

-- Clean up orphaned test_orders (new test table)
DELETE FROM test_orders
WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.id = test_orders.event_id);

-- Clean up orphaned test_event_rsvps
DELETE FROM test_event_rsvps
WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.id = test_event_rsvps.event_id);

-- Clean up orphaned test_event_interests
DELETE FROM test_event_interests
WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.id = test_event_interests.event_id);

-- Clean up orphaned test_profiles (not referenced by any remaining test data)
DELETE FROM test_profiles tp
WHERE NOT EXISTS (SELECT 1 FROM test_event_rsvps ter WHERE ter.test_profile_id = tp.id)
AND NOT EXISTS (SELECT 1 FROM test_event_interests tei WHERE tei.test_profile_id = tp.id)
AND NOT EXISTS (SELECT 1 FROM test_orders tor WHERE tor.test_profile_id = tp.id);

-- Clean up orphaned guests (only those with no orders at all)
-- We check both test_data=true orders (which were deleted above) and any remaining orders
DELETE FROM guests g
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.guest_id = g.id);
