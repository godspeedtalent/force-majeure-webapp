-- ========================================
-- Add FM Team Role
-- ========================================
-- This script creates a new "FM Team" role with basic permissions
-- Run this in Supabase SQL Editor

-- Insert the FM Team role
INSERT INTO public.roles (name, display_name, description, is_system_role, permission_ids)
SELECT
  'fm_team',
  'FM Team',
  'Force Majeure team member with standard access',
  false,
  ARRAY(SELECT id FROM public.permissions WHERE name IN ('view_events', 'purchase_tickets', 'manage_own_profile'))
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'fm_team');

-- Verify the role was created
SELECT 'FM Team Role Created:' as status;
SELECT
  name,
  display_name,
  description,
  (SELECT array_agg(p.name) FROM public.permissions p WHERE p.id = ANY(r.permission_ids)) as permissions
FROM public.roles r
WHERE r.name = 'fm_team';
