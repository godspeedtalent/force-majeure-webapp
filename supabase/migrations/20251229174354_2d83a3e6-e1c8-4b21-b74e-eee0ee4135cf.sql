-- Add missing roles: artist and venue_admin
INSERT INTO roles (name, display_name, description, permissions)
VALUES 
  ('artist', 'Artist', 'Artist role for users linked to an artist profile', '[]'::jsonb),
  ('venue_admin', 'Venue Admin', 'Admin for a specific venue', '["manage_venues"]'::jsonb)
ON CONFLICT (name) DO NOTHING;