-- ============================================
-- EVENT PROMO CODES & STAFF MANAGEMENT
-- Migration: 20260112000000
-- ============================================

-- ============================================
-- 1. EVENT_PROMO_CODES - Junction table for event-specific promo codes
-- ============================================

CREATE TABLE IF NOT EXISTS event_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, promo_code_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_promo_codes_event_id ON event_promo_codes(event_id);
CREATE INDEX IF NOT EXISTS idx_event_promo_codes_promo_code_id ON event_promo_codes(promo_code_id);

-- Enable RLS
ALTER TABLE event_promo_codes ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON event_promo_codes TO authenticated;
GRANT SELECT ON event_promo_codes TO anon;

-- RLS Policies for event_promo_codes

-- Public can view active promo code linkages
CREATE POLICY "Public can view event promo codes"
  ON event_promo_codes FOR SELECT
  USING (true);

-- Admins/developers can manage all event promo codes
CREATE POLICY "Admins can manage event promo codes"
  ON event_promo_codes FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- ============================================
-- 2. EVENT_STAFF - Staff assignments for events
-- ============================================

CREATE TABLE IF NOT EXISTS event_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('staff', 'manager')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Either user_id OR organization_id must be set, but not both
  CONSTRAINT user_or_org_required CHECK (
    (user_id IS NOT NULL AND organization_id IS NULL) OR
    (user_id IS NULL AND organization_id IS NOT NULL)
  )
);

-- Unique constraints to prevent duplicate assignments
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_staff_event_user
  ON event_staff(event_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_staff_event_org
  ON event_staff(event_id, organization_id) WHERE organization_id IS NOT NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_staff_event_id ON event_staff(event_id);
CREATE INDEX IF NOT EXISTS idx_event_staff_user_id ON event_staff(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_staff_organization_id ON event_staff(organization_id) WHERE organization_id IS NOT NULL;

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_event_staff_updated_at ON event_staff;
CREATE TRIGGER update_event_staff_updated_at
  BEFORE UPDATE ON event_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE event_staff ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON event_staff TO authenticated;

-- RLS Policies for event_staff

-- Users can view their own staff assignments (direct user assignment)
CREATE POLICY "Users can view their staff assignments"
  ON event_staff FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Organization owners can view staff assignments for their orgs
CREATE POLICY "Org owners can view their org staff assignments"
  ON event_staff FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Admins/developers can view all staff assignments
CREATE POLICY "Admins can view all staff assignments"
  ON event_staff FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Admins/developers can manage all staff assignments
CREATE POLICY "Admins can manage staff assignments"
  ON event_staff FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

CREATE POLICY "Admins can update staff assignments"
  ON event_staff FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

CREATE POLICY "Admins can delete staff assignments"
  ON event_staff FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Event managers can manage staff for their events
CREATE POLICY "Event managers can manage their event staff"
  ON event_staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_staff es
      WHERE es.event_id = event_staff.event_id
        AND es.user_id = auth.uid()
        AND es.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_staff es
      WHERE es.event_id = event_staff.event_id
        AND es.user_id = auth.uid()
        AND es.role = 'manager'
    )
  );

-- ============================================
-- 3. HELPER FUNCTION - Check if user is event staff
-- ============================================

CREATE OR REPLACE FUNCTION is_event_staff(p_user_id UUID, p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM event_staff
    WHERE event_id = p_event_id
      AND (
        user_id = p_user_id OR
        organization_id IN (
          SELECT id FROM organizations WHERE owner_id = p_user_id
        )
      )
  );
END;
$$;

-- ============================================
-- 4. HELPER FUNCTION - Check if user is event manager
-- ============================================

CREATE OR REPLACE FUNCTION is_event_manager(p_user_id UUID, p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM event_staff
    WHERE event_id = p_event_id
      AND role = 'manager'
      AND (
        user_id = p_user_id OR
        organization_id IN (
          SELECT id FROM organizations WHERE owner_id = p_user_id
        )
      )
  );
END;
$$;
