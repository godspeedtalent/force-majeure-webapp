-- ========================================
-- Create Roles & Permissions Tables
-- ========================================
-- Run this in Supabase SQL Editor

-- 1. Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'events', 'users', 'organization', 'system'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS on permissions
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;
CREATE POLICY "Anyone can view permissions" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "Admins can manage permissions" ON public.permissions FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- 3. Insert default permissions
INSERT INTO public.permissions (name, display_name, description, category) VALUES
  ('*', 'All Permissions', 'Full system access', 'system'),
  ('debug_mode', 'Debug Mode', 'Access to debug tools and logs', 'system'),
  ('view_events', 'View Events', 'View event listings', 'events'),
  ('purchase_tickets', 'Purchase Tickets', 'Buy tickets to events', 'events'),
  ('manage_organization', 'Manage Organization', 'Full organization management', 'organization'),
  ('manage_events', 'Manage Events', 'Create and edit events', 'events'),
  ('view_analytics', 'View Analytics', 'Access analytics dashboard', 'organization'),
  ('manage_staff', 'Manage Staff', 'Add and remove staff members', 'organization'),
  ('view_organization', 'View Organization', 'View organization details', 'organization'),
  ('check_in_guests', 'Check-in Guests', 'Check guests into events', 'events'),
  ('scan_tickets', 'Scan Tickets', 'Scan and validate tickets', 'events'),
  ('manage_own_profile', 'Manage Own Profile', 'Edit own user profile', 'users')
ON CONFLICT (name) DO NOTHING;

-- 4. Create roles table with permission_ids array
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  permission_ids UUID[] DEFAULT '{}',
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add permission_ids column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'roles' 
    AND column_name = 'permission_ids'
  ) THEN
    ALTER TABLE public.roles ADD COLUMN permission_ids UUID[] DEFAULT '{}';
  END IF;
END $$;

-- 5. Enable RLS on roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view roles" ON public.roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
CREATE POLICY "Anyone can view roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Admins can manage roles" ON public.roles FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- 6. Insert default roles with permission_ids
INSERT INTO public.roles (name, display_name, description, is_system_role, permission_ids)
SELECT 'admin', 'Administrator', 'Full system administrator', true,
  ARRAY(SELECT id FROM public.permissions WHERE name = '*')
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'admin');

INSERT INTO public.roles (name, display_name, description, is_system_role, permission_ids)
SELECT 'developer', 'Developer', 'Developer access for testing', true,
  ARRAY(SELECT id FROM public.permissions WHERE name IN ('*', 'debug_mode'))
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'developer');

INSERT INTO public.roles (name, display_name, description, is_system_role, permission_ids)
SELECT 'org_admin', 'Organization Admin', 'Manage organization and events', false,
  ARRAY(SELECT id FROM public.permissions WHERE name IN ('manage_organization', 'manage_events', 'view_analytics', 'manage_staff'))
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'org_admin');

INSERT INTO public.roles (name, display_name, description, is_system_role, permission_ids)
SELECT 'org_staff', 'Organization Staff', 'Check-in and scan tickets', false,
  ARRAY(SELECT id FROM public.permissions WHERE name IN ('view_organization', 'check_in_guests', 'scan_tickets'))
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'org_staff');

-- 7. User roles migration (keep existing code)
-- 4. Add role_id to user_roles table
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE;

-- 5. Migrate existing data from role enum to role_id
UPDATE public.user_roles ur
SET role_id = r.id
FROM public.roles r
WHERE r.name = ur.role::text
AND ur.role_id IS NULL;

-- 6. Drop the old enum column NOT NULL constraint first
ALTER TABLE public.user_roles ALTER COLUMN role DROP NOT NULL;

-- 7. Make role_id required
ALTER TABLE public.user_roles ALTER COLUMN role_id SET NOT NULL;

-- 8. Update unique constraint (drop old, add new)
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_id_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_id_key UNIQUE (user_id, role_id);

-- 9. Optional: Drop the old enum column (uncomment if you're confident migration worked)
-- ALTER TABLE public.user_roles DROP COLUMN role;

-- 10. Create indexes
CREATE INDEX IF NOT EXISTS idx_permissions_name ON public.permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category);
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

-- 11. Helper functions with permission support
CREATE OR REPLACE FUNCTION public.has_role(user_id_param UUID, role_name_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_id_param
    AND r.name = role_name_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Get user's roles with permissions (drop first to change signature)
DROP FUNCTION IF EXISTS public.get_user_roles(UUID);
CREATE FUNCTION public.get_user_roles(user_id_param UUID)
RETURNS TABLE (
  role_name TEXT, 
  display_name TEXT, 
  permission_names TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.name,
    r.display_name,
    ARRAY(
      SELECT p.name 
      FROM public.permissions p 
      WHERE p.id = ANY(r.permission_ids)
    ) as permission_names
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(user_id_param UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    JOIN public.permissions p ON p.id = ANY(r.permission_ids)
    WHERE ur.user_id = user_id_param
    AND (p.name = '*' OR p.name = permission_name)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Assign yourself all roles
INSERT INTO public.user_roles (user_id, role_id)
SELECT 'e5f719c1-d1b5-4081-9d46-2cbe0f95509f', r.id
FROM public.roles r
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Verify everything
SELECT 'Available Permissions:' as section;
SELECT name, display_name, category FROM public.permissions ORDER BY category, name;

SELECT 'Available Roles:' as section;
SELECT name, display_name, description, array_length(permission_ids, 1) as permission_count FROM public.roles;

SELECT 'Your Roles:' as section;
SELECT r.name, r.display_name, 
  (SELECT array_agg(p.name) FROM public.permissions p WHERE p.id = ANY(r.permission_ids)) as permissions
FROM public.user_roles ur
JOIN public.roles r ON r.id = ur.role_id
WHERE ur.user_id = 'e5f719c1-d1b5-4081-9d46-2cbe0f95509f';
