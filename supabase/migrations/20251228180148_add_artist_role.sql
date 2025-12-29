-- Migration: Add artist role
-- Description: Adds the 'artist' role for approved artists
-- The artist role is assigned when an admin approves an artist registration

INSERT INTO roles (name, display_name, description, permissions, is_system_role)
VALUES (
  'artist',
  'Artist',
  'Approved artist with artist-specific features',
  '[]'::jsonb,
  true
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  is_system_role = EXCLUDED.is_system_role;
