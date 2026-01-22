-- Migration: Fix guest list RLS policies and add RSVP scanning infrastructure
--
-- This migration fixes 3 critical RLS policy gaps that prevent guest lists from
-- loading correctly for non-admin users, and adds infrastructure for RSVP scanning.
--
-- Issues fixed:
-- 1. profiles: No policy allowing read of public profiles (guest_list_visible = true)
-- 2. orders: No policy allowing read of completed orders for guest list
-- 3. guests: No SELECT policy for non-admins
--
-- New features:
-- 4. RSVP check-in columns (checked_in_at, checked_in_by)
-- 5. rsvp_scan_events audit table
-- 6. Event manager RSVP management policy

-- ============================================================================
-- PART 1: PROFILES RLS FIX
-- Allow reading profiles where guest_list_visible = true
-- ============================================================================

DROP POLICY IF EXISTS "Guest list visible profiles are publicly readable" ON profiles;
CREATE POLICY "Guest list visible profiles are publicly readable"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (guest_list_visible = true);

-- ============================================================================
-- PART 2: ORDERS RLS FIX
-- Allow reading completed orders for guest list display
-- ============================================================================

DROP POLICY IF EXISTS "Orders are readable for guest list display" ON orders;
CREATE POLICY "Orders are readable for guest list display"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (status = 'completed');

-- ============================================================================
-- PART 3: GUESTS RLS FIX
-- Allow reading guests for guest list display (info is anonymized in UI)
-- ============================================================================

DROP POLICY IF EXISTS "Guests are readable for guest list display" ON guests;
CREATE POLICY "Guests are readable for guest list display"
  ON guests FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- PART 4: EVENT MANAGER RSVP POLICY
-- Allow event managers to manage RSVPs for their events
-- ============================================================================

DROP POLICY IF EXISTS "Event managers can manage event RSVPs" ON event_rsvps;
CREATE POLICY "Event managers can manage event RSVPs"
  ON event_rsvps FOR ALL
  TO authenticated
  USING (is_event_manager(auth.uid(), event_id));

-- ============================================================================
-- PART 5: RSVP CHECK-IN COLUMNS
-- Add columns to track when RSVPs are checked in at the door
-- ============================================================================

ALTER TABLE event_rsvps
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS checked_in_by TEXT;

COMMENT ON COLUMN event_rsvps.checked_in_at IS 'Timestamp when the RSVP was scanned/checked in at the venue';
COMMENT ON COLUMN event_rsvps.checked_in_by IS 'Email or ID of the staff member who scanned the RSVP';

-- Add index for efficient lookup of checked-in RSVPs
CREATE INDEX IF NOT EXISTS idx_event_rsvps_checked_in
  ON event_rsvps(event_id, checked_in_at)
  WHERE checked_in_at IS NOT NULL;

-- ============================================================================
-- PART 6: RSVP SCAN EVENTS TABLE
-- Audit log for all RSVP scan attempts (similar to ticket_scan_events)
-- ============================================================================

CREATE TABLE IF NOT EXISTS rsvp_scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rsvp_id UUID REFERENCES event_rsvps(id) ON DELETE SET NULL,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  scanned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_result TEXT NOT NULL CHECK (scan_result IN ('success', 'already_scanned', 'invalid', 'cancelled', 'not_found', 'event_mismatch')),
  scan_location JSONB,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE rsvp_scan_events IS 'Audit log for RSVP scan attempts at venue entry';
COMMENT ON COLUMN rsvp_scan_events.scan_result IS 'Result of the scan: success, already_scanned, invalid, cancelled, not_found, event_mismatch';

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_rsvp_scan_events_event_id ON rsvp_scan_events(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_scan_events_rsvp_id ON rsvp_scan_events(rsvp_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_scan_events_created_at ON rsvp_scan_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rsvp_scan_events_scanned_by ON rsvp_scan_events(scanned_by);

-- Enable RLS
ALTER TABLE rsvp_scan_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rsvp_scan_events

-- Staff with scan_tickets permission can view scan events
DROP POLICY IF EXISTS "Staff with scan permission can view RSVP scan events" ON rsvp_scan_events;
CREATE POLICY "Staff with scan permission can view RSVP scan events"
  ON rsvp_scan_events FOR SELECT
  TO authenticated
  USING (
    has_permission(auth.uid(), 'scan_tickets')
  );

-- Admins and developers can view all scan events
DROP POLICY IF EXISTS "Admins can view all RSVP scan events" ON rsvp_scan_events;
CREATE POLICY "Admins can view all RSVP scan events"
  ON rsvp_scan_events FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Event managers can view scan events for their events
DROP POLICY IF EXISTS "Event managers can view their event RSVP scan events" ON rsvp_scan_events;
CREATE POLICY "Event managers can view their event RSVP scan events"
  ON rsvp_scan_events FOR SELECT
  TO authenticated
  USING (is_event_manager(auth.uid(), event_id));

-- Authenticated users with scan permission can insert scan events
DROP POLICY IF EXISTS "Authenticated users can insert RSVP scan events" ON rsvp_scan_events;
CREATE POLICY "Authenticated users can insert RSVP scan events"
  ON rsvp_scan_events FOR INSERT
  TO authenticated
  WITH CHECK (
    scanned_by = auth.uid() AND (
      has_permission(auth.uid(), 'scan_tickets') OR
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer') OR
      is_dev_admin(auth.uid())
    )
  );

-- Grant permissions
GRANT SELECT, INSERT ON rsvp_scan_events TO authenticated;

-- ============================================================================
-- PART 7: RSVP QR VERIFICATION FUNCTIONS
-- Server-side functions for generating and verifying RSVP QR signatures
-- ============================================================================

-- Function to generate RSVP QR signature (for client-side QR generation)
-- Note: This requires the QR_SECRET_KEY to be set in database secrets
CREATE OR REPLACE FUNCTION generate_rsvp_signature(p_rsvp_id UUID, p_event_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_secret TEXT;
  v_data TEXT;
  v_signature TEXT;
BEGIN
  -- Get secret from database settings (must be configured)
  v_secret := current_setting('app.qr_secret_key', true);

  -- Fallback for development (NOT for production!)
  IF v_secret IS NULL OR v_secret = '' THEN
    v_secret := 'dev-secret-key-change-in-production-immediately';
  END IF;

  -- Create data string
  v_data := p_rsvp_id::TEXT || ':' || p_event_id::TEXT || ':v1';

  -- Generate HMAC-SHA256 and take first 16 characters
  v_signature := substring(encode(hmac(v_data, v_secret, 'sha256'), 'hex'), 1, 16);

  RETURN v_signature;
END;
$$;

-- Function to verify RSVP QR signature
CREATE OR REPLACE FUNCTION verify_rsvp_signature(p_rsvp_id UUID, p_event_id UUID, p_signature TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_expected_signature TEXT;
BEGIN
  v_expected_signature := generate_rsvp_signature(p_rsvp_id, p_event_id);
  RETURN p_signature = v_expected_signature;
END;
$$;

-- Grant execute permissions to authenticated users (for the edge function)
GRANT EXECUTE ON FUNCTION generate_rsvp_signature(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_rsvp_signature(UUID, UUID, TEXT) TO authenticated;

-- ============================================================================
-- PART 8: HELPER FUNCTION FOR GETTING RSVP WITH DETAILS
-- Used by the validate-rsvp edge function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_rsvp_with_details(p_rsvp_id UUID)
RETURNS TABLE (
  id UUID,
  event_id UUID,
  user_id UUID,
  status TEXT,
  checked_in_at TIMESTAMPTZ,
  checked_in_by TEXT,
  event_title TEXT,
  event_start_time TIMESTAMPTZ,
  venue_name TEXT,
  attendee_name TEXT,
  attendee_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.event_id,
    r.user_id,
    r.status,
    r.checked_in_at,
    r.checked_in_by,
    e.title AS event_title,
    e.start_time AS event_start_time,
    v.name AS venue_name,
    COALESCE(p.display_name, p.full_name) AS attendee_name,
    p.email AS attendee_email
  FROM event_rsvps r
  JOIN events e ON r.event_id = e.id
  LEFT JOIN venues v ON e.venue_id = v.id
  LEFT JOIN profiles p ON r.user_id = p.id
  WHERE r.id = p_rsvp_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_rsvp_with_details(UUID) TO authenticated;

-- ============================================================================
-- PART 9: ADD rsvp_scanned TO ACTIVITY EVENT TYPE ENUM (if not exists)
-- ============================================================================

DO $$
BEGIN
  -- Check if the value exists before adding
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'activity_event_type'::regtype
    AND enumlabel = 'rsvp_scanned'
  ) THEN
    ALTER TYPE activity_event_type ADD VALUE IF NOT EXISTS 'rsvp_scanned';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- Type doesn't exist, skip
    NULL;
END;
$$;
