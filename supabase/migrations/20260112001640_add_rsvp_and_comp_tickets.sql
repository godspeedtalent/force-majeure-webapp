-- ============================================
-- RSVP and Complementary Tickets System
-- Adds support for free events with RSVP, guest list privacy,
-- and complementary ticket distribution
-- ============================================

-- ============================================
-- 1. Add free event columns to events table
-- ============================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_free_event BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rsvp_capacity INTEGER;

COMMENT ON COLUMN events.is_free_event IS 'If true, event uses RSVP system instead of paid ticketing';
COMMENT ON COLUMN events.rsvp_capacity IS 'Maximum RSVPs allowed for free events (null = unlimited)';

-- ============================================
-- 2. Add guest list visibility to profiles
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS guest_list_visible BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN profiles.guest_list_visible IS 'Whether user appears in public guest lists for events they attend';

-- ============================================
-- 3. Create event_rsvps table
-- ============================================

CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'waitlisted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Indexes for event_rsvps
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_status ON event_rsvps(status);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_created_at ON event_rsvps(created_at DESC);

-- Enable RLS
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON event_rsvps TO authenticated;
GRANT SELECT ON event_rsvps TO anon;

-- RLS Policies for event_rsvps

-- Public can view RSVPs (for guest list display)
DROP POLICY IF EXISTS "Public read access" ON event_rsvps;
CREATE POLICY "Public read access" ON event_rsvps
  FOR SELECT USING (true);

-- Authenticated users can insert their own RSVP
DROP POLICY IF EXISTS "Users can insert own RSVP" ON event_rsvps;
CREATE POLICY "Users can insert own RSVP" ON event_rsvps
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own RSVP
DROP POLICY IF EXISTS "Users can update own RSVP" ON event_rsvps;
CREATE POLICY "Users can update own RSVP" ON event_rsvps
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own RSVP
DROP POLICY IF EXISTS "Users can delete own RSVP" ON event_rsvps;
CREATE POLICY "Users can delete own RSVP" ON event_rsvps
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all RSVPs
DROP POLICY IF EXISTS "Admins can manage all RSVPs" ON event_rsvps;
CREATE POLICY "Admins can manage all RSVPs" ON event_rsvps
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- ============================================
-- 4. Create comp_tickets table
-- ============================================

CREATE TABLE IF NOT EXISTS comp_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_tier_id UUID NOT NULL REFERENCES ticket_tiers(id) ON DELETE CASCADE,

  -- Recipient info
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Tracking info (basic)
  issued_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Claim status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired', 'revoked')),
  claim_token UUID UNIQUE DEFAULT gen_random_uuid(),
  claimed_at TIMESTAMPTZ,
  claimed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Link to actual ticket once claimed
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

  -- Expiration
  expires_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for comp_tickets
CREATE INDEX IF NOT EXISTS idx_comp_tickets_event_id ON comp_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_comp_tickets_recipient_email ON comp_tickets(recipient_email);
CREATE INDEX IF NOT EXISTS idx_comp_tickets_recipient_user_id ON comp_tickets(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_comp_tickets_status ON comp_tickets(status);
CREATE INDEX IF NOT EXISTS idx_comp_tickets_claim_token ON comp_tickets(claim_token);
CREATE INDEX IF NOT EXISTS idx_comp_tickets_issued_by ON comp_tickets(issued_by_user_id);

-- Enable RLS
ALTER TABLE comp_tickets ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON comp_tickets TO authenticated;
GRANT SELECT ON comp_tickets TO anon;

-- RLS Policies for comp_tickets

-- Admins can manage all comp tickets
DROP POLICY IF EXISTS "Admins can manage all comp tickets" ON comp_tickets;
CREATE POLICY "Admins can manage all comp tickets" ON comp_tickets
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Users can view their own comp tickets (by recipient_user_id or email match)
DROP POLICY IF EXISTS "Users can view own comp tickets" ON comp_tickets;
CREATE POLICY "Users can view own comp tickets" ON comp_tickets
  FOR SELECT TO authenticated
  USING (
    recipient_user_id = auth.uid() OR
    recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Anonymous can view by claim token (for claim page)
DROP POLICY IF EXISTS "Public can view by claim token" ON comp_tickets;
CREATE POLICY "Public can view by claim token" ON comp_tickets
  FOR SELECT TO anon
  USING (claim_token IS NOT NULL);

-- ============================================
-- 5. RPC Functions for RSVP
-- ============================================

-- Get RSVP count for an event
CREATE OR REPLACE FUNCTION get_event_rsvp_count(p_event_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM event_rsvps
    WHERE event_id = p_event_id AND status = 'confirmed'
  );
END;
$$;

-- Check if user has RSVP'd to an event
CREATE OR REPLACE FUNCTION has_user_rsvp(p_user_id UUID, p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM event_rsvps
    WHERE user_id = p_user_id AND event_id = p_event_id AND status = 'confirmed'
  );
END;
$$;

-- Toggle RSVP (create or cancel)
CREATE OR REPLACE FUNCTION toggle_event_rsvp(p_event_id UUID)
RETURNS TABLE(rsvp_id UUID, action TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing_id UUID;
  v_event_capacity INTEGER;
  v_current_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if RSVP exists
  SELECT id INTO v_existing_id
  FROM event_rsvps
  WHERE event_id = p_event_id AND user_id = v_user_id AND status = 'confirmed';

  IF v_existing_id IS NOT NULL THEN
    -- Cancel existing RSVP
    UPDATE event_rsvps
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = v_existing_id;

    RETURN QUERY SELECT v_existing_id, 'cancelled'::TEXT;
  ELSE
    -- Check capacity
    SELECT rsvp_capacity INTO v_event_capacity
    FROM events
    WHERE id = p_event_id;

    IF v_event_capacity IS NOT NULL THEN
      SELECT COUNT(*)::INTEGER INTO v_current_count
      FROM event_rsvps
      WHERE event_id = p_event_id AND status = 'confirmed';

      IF v_current_count >= v_event_capacity THEN
        RAISE EXCEPTION 'Event is at capacity';
      END IF;
    END IF;

    -- Create new RSVP or re-confirm cancelled one
    INSERT INTO event_rsvps (event_id, user_id, status)
    VALUES (p_event_id, v_user_id, 'confirmed')
    ON CONFLICT (event_id, user_id)
    DO UPDATE SET status = 'confirmed', updated_at = NOW()
    RETURNING id INTO v_existing_id;

    RETURN QUERY SELECT v_existing_id, 'confirmed'::TEXT;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_event_rsvp_count TO authenticated, anon;
GRANT EXECUTE ON FUNCTION has_user_rsvp TO authenticated, anon;
GRANT EXECUTE ON FUNCTION toggle_event_rsvp TO authenticated;

-- ============================================
-- 6. RPC Functions for Comp Tickets
-- ============================================

-- Get comp ticket by claim token
CREATE OR REPLACE FUNCTION get_comp_ticket_by_token(p_claim_token UUID)
RETURNS TABLE(
  id UUID,
  event_id UUID,
  ticket_tier_id UUID,
  recipient_email TEXT,
  status TEXT,
  expires_at TIMESTAMPTZ,
  event_title TEXT,
  tier_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ct.id,
    ct.event_id,
    ct.ticket_tier_id,
    ct.recipient_email,
    ct.status,
    ct.expires_at,
    e.title::TEXT as event_title,
    tt.name::TEXT as tier_name
  FROM comp_tickets ct
  JOIN events e ON e.id = ct.event_id
  JOIN ticket_tiers tt ON tt.id = ct.ticket_tier_id
  WHERE ct.claim_token = p_claim_token;
END;
$$;

GRANT EXECUTE ON FUNCTION get_comp_ticket_by_token TO authenticated, anon;

-- ============================================
-- 7. Add updated_at trigger for new tables
-- ============================================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to event_rsvps
DROP TRIGGER IF EXISTS update_event_rsvps_updated_at ON event_rsvps;
CREATE TRIGGER update_event_rsvps_updated_at
  BEFORE UPDATE ON event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to comp_tickets
DROP TRIGGER IF EXISTS update_comp_tickets_updated_at ON comp_tickets;
CREATE TRIGGER update_comp_tickets_updated_at
  BEFORE UPDATE ON comp_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
