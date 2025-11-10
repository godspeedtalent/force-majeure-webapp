-- Add additional roles to app_role enum: developer, org_staff, org_admin

DO $$ 
BEGIN
  -- Add developer role
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'developer' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'developer';
  END IF;
  
  -- Add org_staff role (for organization staff members)
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'org_staff' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'org_staff';
  END IF;
  
  -- Add org_admin role (for organization administrators)
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'org_admin' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'org_admin';
  END IF;
END $$;

-- Update RLS policies to include developer role where appropriate
-- Developers should have similar access to admins for development purposes

-- Update existing admin policies to include developers
DROP POLICY IF EXISTS "Admins and developers can view all roles" ON public.user_roles;
CREATE POLICY "Admins and developers can view all roles"
ON public.user_roles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'developer'::app_role)
  OR is_dev_admin()
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- Allow admins and developers to insert roles
DROP POLICY IF EXISTS "Admins can insert user_roles" ON public.user_roles;
CREATE POLICY "Admins and developers can insert user_roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'developer'::app_role)
  OR is_dev_admin()
);

-- Allow admins and developers to update roles
DROP POLICY IF EXISTS "Admins can update user_roles" ON public.user_roles;
CREATE POLICY "Admins and developers can update user_roles"
ON public.user_roles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'developer'::app_role)
  OR is_dev_admin()
);

-- Allow admins and developers to delete roles
DROP POLICY IF EXISTS "Admins can delete user_roles" ON public.user_roles;
CREATE POLICY "Admins and developers can delete user_roles"
ON public.user_roles
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'developer'::app_role)
  OR is_dev_admin()
);
