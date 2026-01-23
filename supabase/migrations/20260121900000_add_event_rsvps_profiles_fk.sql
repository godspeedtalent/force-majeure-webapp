-- ============================================
-- Add foreign key from event_rsvps to profiles
-- ============================================
-- This enables PostgREST to join event_rsvps with profiles
-- for fetching attendee profile data in guest lists.
--
-- The event_rsvps table currently references auth.users(id),
-- but we need a direct FK to profiles for PostgREST joins.
-- Since profiles.id = auth.users.id, this is a valid relationship.

-- Add the foreign key constraint (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'event_rsvps_user_id_profiles_fkey'
    AND table_name = 'event_rsvps'
  ) THEN
    ALTER TABLE event_rsvps
      ADD CONSTRAINT event_rsvps_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for the FK if not already covered
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id_profiles
  ON event_rsvps(user_id);
