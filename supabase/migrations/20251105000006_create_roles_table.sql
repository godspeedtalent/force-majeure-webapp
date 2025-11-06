-- ========================================
-- Create Roles Reference Table
-- ========================================
-- This creates a proper roles table with metadata
-- and updates user_roles to reference it via foreign key

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Anyone can view roles
CREATE POLICY "Anyone can view roles"
ON public.roles
FOR SELECT
USING (true);

-- Only admins and developers can manage roles
CREATE POLICY "Admins and developers can manage roles"
ON public.roles
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'developer'::app_role)
  OR is_dev_admin()
);

-- Insert default roles
INSERT INTO public.roles (name, display_name, description, is_system_role, permissions) VALUES
  ('user', 'User', 'Standard user with basic access', true, '["view_events", "purchase_tickets", "manage_own_profile"]'::jsonb),
  ('admin', 'Administrator', 'Full system administrator with all permissions', true, '["*"]'::jsonb),
  ('developer', 'Developer', 'Developer access for testing and debugging', true, '["*", "debug_mode", "feature_flags"]'::jsonb),
  ('org_admin', 'Organization Admin', 'Administrator of an organization with venue management access', false, '["manage_organization", "manage_events", "view_analytics", "manage_staff"]'::jsonb),
  ('org_staff', 'Organization Staff', 'Organization staff member with limited permissions', false, '["view_organization", "check_in_guests", "scan_tickets"]'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

-- Create index on role name for faster lookups
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Update user_roles table to use role_id instead of role enum
-- First, add the new column
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE;

-- Migrate existing data (if any) from role enum to role_id
DO $$
DECLARE
  role_record RECORD;
BEGIN
  FOR role_record IN 
    SELECT ur.id as user_role_id, ur.role as role_name, r.id as role_id
    FROM public.user_roles ur
    JOIN public.roles r ON r.name = ur.role::text
    WHERE ur.role_id IS NULL
  LOOP
    UPDATE public.user_roles 
    SET role_id = role_record.role_id
    WHERE id = role_record.user_role_id;
  END LOOP;
END $$;

-- Make role_id NOT NULL after migration
ALTER TABLE public.user_roles 
ALTER COLUMN role_id SET NOT NULL;

-- Drop the old role enum column (commented out for safety - uncomment after verifying migration)
-- ALTER TABLE public.user_roles DROP COLUMN IF EXISTS role;

-- Update unique constraint to use role_id
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_role_id_key UNIQUE (user_id, role_id);

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

-- Update the has_role function to work with the new structure
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

-- Helper function to get all roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(user_id_param UUID)
RETURNS TABLE (
  role_name TEXT,
  display_name TEXT,
  permissions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.name, r.display_name, r.permissions
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(user_id_param UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_id_param
    AND (
      r.permissions @> '["*"]'::jsonb
      OR r.permissions @> jsonb_build_array(permission_name)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Show final structure
SELECT 'Roles Table:' as info;
SELECT * FROM public.roles ORDER BY name;

SELECT 'User Roles:' as info;
SELECT ur.id, ur.user_id, r.name as role_name, r.display_name, ur.created_at
FROM public.user_roles ur
JOIN public.roles r ON r.id = ur.role_id
ORDER BY ur.created_at DESC;
