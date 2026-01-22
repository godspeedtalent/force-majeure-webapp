-- ============================================
-- Test Profiles Table Migration
-- ============================================
-- Creates a dedicated test_profiles table for mock data generation.
-- Unlike the profiles table, this table does NOT have a foreign key
-- constraint to auth.users, allowing test profiles to be created
-- without requiring actual auth users.
-- ============================================

-- ============================================
-- 1. Create test_profiles table
-- ============================================
CREATE TABLE IF NOT EXISTS test_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_profiles_email ON test_profiles(email);
CREATE INDEX IF NOT EXISTS idx_test_profiles_created_at ON test_profiles(created_at DESC);

COMMENT ON TABLE test_profiles IS 'Test profiles for mock data generation. Not linked to auth.users.';

-- ============================================
-- 2. Enable RLS and policies
-- ============================================
ALTER TABLE test_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage test profiles" ON test_profiles;
CREATE POLICY "Admins can manage test profiles"
  ON test_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON test_profiles TO authenticated;

-- ============================================
-- 3. Create test_event_rsvps table
-- ============================================
CREATE TABLE IF NOT EXISTS test_event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  test_profile_id UUID NOT NULL REFERENCES test_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'waitlisted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, test_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_test_event_rsvps_event_id ON test_event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_test_event_rsvps_test_profile_id ON test_event_rsvps(test_profile_id);

COMMENT ON TABLE test_event_rsvps IS 'Test RSVPs for mock data generation.';

ALTER TABLE test_event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage test RSVPs" ON test_event_rsvps;
CREATE POLICY "Admins can manage test RSVPs"
  ON test_event_rsvps FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON test_event_rsvps TO authenticated;

-- ============================================
-- 4. Create test_event_interests table
-- ============================================
CREATE TABLE IF NOT EXISTS test_event_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  test_profile_id UUID NOT NULL REFERENCES test_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, test_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_test_event_interests_event_id ON test_event_interests(event_id);
CREATE INDEX IF NOT EXISTS idx_test_event_interests_test_profile_id ON test_event_interests(test_profile_id);

COMMENT ON TABLE test_event_interests IS 'Test event interests for mock data generation.';

ALTER TABLE test_event_interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage test interests" ON test_event_interests;
CREATE POLICY "Admins can manage test interests"
  ON test_event_interests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON test_event_interests TO authenticated;

-- ============================================
-- 5. Update delete_mock_orders_by_event function
-- ============================================
-- Must drop first because return type is changing (adding new columns)
DROP FUNCTION IF EXISTS delete_mock_orders_by_event(UUID);

CREATE FUNCTION delete_mock_orders_by_event(p_event_id UUID)
RETURNS TABLE (
  deleted_tickets INTEGER,
  deleted_order_items INTEGER,
  deleted_orders INTEGER,
  deleted_guests INTEGER,
  deleted_rsvps INTEGER,
  deleted_interests INTEGER,
  deleted_test_profiles INTEGER
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
  v_deleted_rsvps INTEGER := 0;
  v_deleted_interests INTEGER := 0;
  v_deleted_test_profiles INTEGER := 0;
  v_order_ids UUID[];
  v_guest_ids UUID[];
  v_test_profile_ids UUID[];
BEGIN
  -- Get all mock order IDs for this event
  SELECT ARRAY_AGG(id) INTO v_order_ids
  FROM orders
  WHERE event_id = p_event_id AND test_data = true;

  -- Get guest IDs that were created for these orders (only orphaned guests)
  IF v_order_ids IS NOT NULL AND array_length(v_order_ids, 1) > 0 THEN
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
  END IF;

  -- Get test profile IDs for this event
  SELECT ARRAY_AGG(DISTINCT tp.id) INTO v_test_profile_ids
  FROM test_profiles tp
  WHERE EXISTS (
    SELECT 1 FROM test_event_rsvps ter WHERE ter.test_profile_id = tp.id AND ter.event_id = p_event_id
  ) OR EXISTS (
    SELECT 1 FROM test_event_interests tei WHERE tei.test_profile_id = tp.id AND tei.event_id = p_event_id
  );

  -- Delete test RSVPs for this event
  DELETE FROM test_event_rsvps WHERE event_id = p_event_id;
  GET DIAGNOSTICS v_deleted_rsvps = ROW_COUNT;

  -- Delete test interests for this event
  DELETE FROM test_event_interests WHERE event_id = p_event_id;
  GET DIAGNOSTICS v_deleted_interests = ROW_COUNT;

  -- Delete orphaned test profiles
  IF v_test_profile_ids IS NOT NULL AND array_length(v_test_profile_ids, 1) > 0 THEN
    DELETE FROM test_profiles tp
    WHERE tp.id = ANY(v_test_profile_ids)
      AND NOT EXISTS (SELECT 1 FROM test_event_rsvps ter WHERE ter.test_profile_id = tp.id)
      AND NOT EXISTS (SELECT 1 FROM test_event_interests tei WHERE tei.test_profile_id = tp.id);
    GET DIAGNOSTICS v_deleted_test_profiles = ROW_COUNT;
  END IF;

  -- If no mock orders, return early
  IF v_order_ids IS NULL OR array_length(v_order_ids, 1) IS NULL THEN
    RETURN QUERY SELECT 0, 0, 0, 0, v_deleted_rsvps, v_deleted_interests, v_deleted_test_profiles;
    RETURN;
  END IF;

  -- Delete tickets
  DELETE FROM tickets WHERE order_id = ANY(v_order_ids);
  GET DIAGNOSTICS v_deleted_tickets = ROW_COUNT;

  -- Delete order items
  DELETE FROM order_items WHERE order_id = ANY(v_order_ids);
  GET DIAGNOSTICS v_deleted_order_items = ROW_COUNT;

  -- Delete orders
  DELETE FROM orders WHERE id = ANY(v_order_ids);
  GET DIAGNOSTICS v_deleted_orders = ROW_COUNT;

  -- Delete orphaned guests
  IF v_guest_ids IS NOT NULL AND array_length(v_guest_ids, 1) > 0 THEN
    DELETE FROM guests WHERE id = ANY(v_guest_ids);
    GET DIAGNOSTICS v_deleted_guests = ROW_COUNT;
  END IF;

  RETURN QUERY SELECT v_deleted_tickets, v_deleted_order_items, v_deleted_orders, v_deleted_guests, v_deleted_rsvps, v_deleted_interests, v_deleted_test_profiles;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_mock_orders_by_event(UUID) TO authenticated;
