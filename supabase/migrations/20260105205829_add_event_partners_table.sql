-- ============================================================================
-- Event Partners Junction Table
-- Allows events to have multiple partner organizations
-- ============================================================================

-- Create event_partners junction table
CREATE TABLE IF NOT EXISTS event_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, organization_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_event_partners_event_id ON event_partners(event_id);
CREATE INDEX IF NOT EXISTS idx_event_partners_organization_id ON event_partners(organization_id);

-- Enable Row Level Security
ALTER TABLE event_partners ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated and anon users
GRANT SELECT ON event_partners TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON event_partners TO authenticated;

-- RLS Policies

-- Anyone can view event partners (events are public)
CREATE POLICY "event_partners_select_policy"
  ON event_partners
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Admins and developers can manage event partners
CREATE POLICY "event_partners_insert_policy"
  ON event_partners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  );

CREATE POLICY "event_partners_update_policy"
  ON event_partners
  FOR UPDATE
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

CREATE POLICY "event_partners_delete_policy"
  ON event_partners
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  );
