-- ============================================
-- ORGANIZATION STAFF MANAGEMENT
-- Migration: 20260121100000
-- ============================================
-- Allows organizations to have multiple staff members with different roles.
-- Separate from the event_staff table which handles per-event staffing.

-- ============================================
-- 1. ORGANIZATION_STAFF - Staff assignments for organizations
-- ============================================

CREATE TABLE IF NOT EXISTS organization_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Each user can only have one role per organization
  UNIQUE(organization_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_organization_staff_org_id ON organization_staff(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_staff_user_id ON organization_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_staff_role ON organization_staff(role);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_organization_staff_updated_at ON organization_staff;
CREATE TRIGGER update_organization_staff_updated_at
  BEFORE UPDATE ON organization_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE organization_staff ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_staff TO authenticated;

-- ============================================
-- 2. RLS POLICIES FOR ORGANIZATION_STAFF
-- ============================================

-- Users can view staff list if they are staff of that org
CREATE POLICY "Org staff can view staff list"
  ON organization_staff FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT os.organization_id FROM organization_staff os WHERE os.user_id = auth.uid()
    )
  );

-- Organization owners can view their org's staff
CREATE POLICY "Org owners can view staff"
  ON organization_staff FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Admins/developers can view all staff
CREATE POLICY "Admins can view all org staff"
  ON organization_staff FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Organization owners can manage their org's staff
CREATE POLICY "Org owners can manage staff"
  ON organization_staff FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Org owners can update staff"
  ON organization_staff FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Org owners can delete staff"
  ON organization_staff FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Org admins (staff with 'admin' role) can manage other staff
CREATE POLICY "Org admins can manage staff"
  ON organization_staff FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT os.organization_id FROM organization_staff os
      WHERE os.user_id = auth.uid() AND os.role = 'admin'
    )
  );

CREATE POLICY "Org admins can update staff"
  ON organization_staff FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT os.organization_id FROM organization_staff os
      WHERE os.user_id = auth.uid() AND os.role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT os.organization_id FROM organization_staff os
      WHERE os.user_id = auth.uid() AND os.role = 'admin'
    )
  );

CREATE POLICY "Org admins can delete staff"
  ON organization_staff FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT os.organization_id FROM organization_staff os
      WHERE os.user_id = auth.uid() AND os.role = 'admin'
    )
  );

-- System admins/developers can manage all staff
CREATE POLICY "System admins can manage all org staff"
  ON organization_staff FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

CREATE POLICY "System admins can update all org staff"
  ON organization_staff FOR UPDATE
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

CREATE POLICY "System admins can delete all org staff"
  ON organization_staff FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- ============================================
-- 3. HELPER FUNCTION - Check if user is organization staff
-- ============================================

CREATE OR REPLACE FUNCTION is_organization_staff(p_user_id UUID, p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is owner
  IF EXISTS (
    SELECT 1 FROM organizations WHERE id = p_organization_id AND owner_id = p_user_id
  ) THEN
    RETURN true;
  END IF;

  -- Check if user is in org_staff table
  RETURN EXISTS (
    SELECT 1 FROM organization_staff
    WHERE organization_id = p_organization_id AND user_id = p_user_id
  );
END;
$$;

-- ============================================
-- 4. HELPER FUNCTION - Check if user is organization admin
-- ============================================

CREATE OR REPLACE FUNCTION is_organization_admin(p_user_id UUID, p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is owner (owners are always admins)
  IF EXISTS (
    SELECT 1 FROM organizations WHERE id = p_organization_id AND owner_id = p_user_id
  ) THEN
    RETURN true;
  END IF;

  -- Check if user has admin role in org_staff table
  RETURN EXISTS (
    SELECT 1 FROM organization_staff
    WHERE organization_id = p_organization_id
      AND user_id = p_user_id
      AND role = 'admin'
  );
END;
$$;

-- ============================================
-- 5. HELPER FUNCTION - Get user's role in organization
-- ============================================

CREATE OR REPLACE FUNCTION get_organization_role(p_user_id UUID, p_organization_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check if user is owner (owners have 'owner' role)
  IF EXISTS (
    SELECT 1 FROM organizations WHERE id = p_organization_id AND owner_id = p_user_id
  ) THEN
    RETURN 'owner';
  END IF;

  -- Get role from org_staff table
  SELECT role INTO v_role
  FROM organization_staff
  WHERE organization_id = p_organization_id AND user_id = p_user_id;

  RETURN v_role; -- Returns NULL if not staff
END;
$$;