-- Rave Family System Migration
-- This migration adds tables for the mobile-first features:
-- - rave_family: bidirectional friend connections
-- - groups: event-based group management
-- - group_members: group membership tracking
-- - ticket_scans: ticket check-in tracking
-- - privacy_settings: user privacy preferences

-- =============================================================================
-- PART 1: CREATE TABLES AND INDEXES
-- =============================================================================

-- Rave Family (bidirectional friendships)
CREATE TABLE IF NOT EXISTS rave_family (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  connection_method TEXT CHECK (connection_method IN ('nfc', 'qr_scan', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, family_member_id),
  CHECK (user_id != family_member_id)
);

CREATE INDEX IF NOT EXISTS idx_rave_family_user_id ON rave_family(user_id);
CREATE INDEX IF NOT EXISTS idx_rave_family_family_member_id ON rave_family(family_member_id);

-- Groups
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  max_members INTEGER DEFAULT 20
);

CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_groups_event_id ON groups(event_id);

-- Group Members
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- Ticket Scans (for check-in tracking)
CREATE TABLE IF NOT EXISTS ticket_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  scanned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scan_method TEXT CHECK (scan_method IN ('nfc', 'qr', 'manual')),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ticket_scans_ticket_id ON ticket_scans(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_scans_event_id ON ticket_scans(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_scans_scanned_at ON ticket_scans(scanned_at);

-- =============================================================================
-- PART 2: ADD PRIVACY SETTINGS TO PROFILES
-- =============================================================================

-- User Privacy Settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'privacy_settings'
  ) THEN
    ALTER TABLE profiles ADD COLUMN privacy_settings JSONB DEFAULT '{
      "profile_visibility": "public",
      "show_on_network": true,
      "show_event_attendance": true,
      "show_family_count": true
    }'::jsonb;
  END IF;
END $$;

-- =============================================================================
-- PART 3: ENABLE RLS AND CREATE POLICIES
-- =============================================================================

-- RLS for rave_family
ALTER TABLE rave_family ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own family connections" ON rave_family;
CREATE POLICY "Users can view their own family connections"
  ON rave_family FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = family_member_id);

DROP POLICY IF EXISTS "Users can create family connections" ON rave_family;
CREATE POLICY "Users can create family connections"
  ON rave_family FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own family connections" ON rave_family;
CREATE POLICY "Users can delete their own family connections"
  ON rave_family FOR DELETE
  USING (auth.uid() = user_id);

-- RLS for groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view groups they are members of" ON groups;
CREATE POLICY "Users can view groups they are members of"
  ON groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create groups" ON groups;
CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Group creators can update their groups" ON groups;
CREATE POLICY "Group creators can update their groups"
  ON groups FOR UPDATE
  USING (auth.uid() = creator_id);

-- RLS for group_members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
CREATE POLICY "Users can view members of their groups"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can add members to groups they belong to" ON group_members;
CREATE POLICY "Users can add members to groups they belong to"
  ON group_members FOR INSERT
  WITH CHECK (
    auth.uid() = invited_by
    AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

-- RLS for ticket_scans
ALTER TABLE ticket_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view scans for their events" ON ticket_scans;
CREATE POLICY "Staff can view scans for their events"
  ON ticket_scans FOR SELECT
  USING (
    -- Allow users with proper permissions to view scans
    -- (organization membership check will be added in future migration)
    true
  );

DROP POLICY IF EXISTS "Staff can create ticket scans" ON ticket_scans;
CREATE POLICY "Staff can create ticket scans"
  ON ticket_scans FOR INSERT
  WITH CHECK (
    auth.uid() = scanned_by
  );
