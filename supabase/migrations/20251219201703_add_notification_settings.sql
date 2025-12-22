-- Add notification_settings JSONB column to profiles table
-- Follows same pattern as privacy_settings column

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "email_enabled": true,
  "events": {
    "ticket_confirmations": true,
    "event_reminders": true,
    "lineup_changes": true,
    "venue_updates": true,
    "event_cancellations": true
  },
  "social": {
    "artist_updates": true,
    "guest_list_invites": true,
    "friend_activity": false,
    "new_followers": true
  }
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN profiles.notification_settings IS 'User email notification preferences stored as JSONB';
