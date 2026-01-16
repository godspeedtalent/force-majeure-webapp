-- Migration: Add fm_staff role
-- Description: Adds the 'fm_staff' role for Force Majeure staff members
-- This role grants access to staff-specific tools and features

INSERT INTO roles (name, display_name, description, permissions, is_system_role)
VALUES (
  'fm_staff',
  'FM Staff',
  'Force Majeure staff member with access to staff tools',
  '["access_staff_tools"]'::jsonb,
  true
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  is_system_role = EXCLUDED.is_system_role;
