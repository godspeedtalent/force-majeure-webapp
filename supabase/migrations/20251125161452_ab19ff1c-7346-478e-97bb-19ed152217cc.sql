-- ========================================
-- SECURITY FIX: Enable RLS on user_roles table
-- ========================================
-- This fixes the critical privilege escalation vulnerability

-- 1. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any (cleanup)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user_roles" ON public.user_roles;

-- 3. Allow users to view their own roles only
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Allow admins to view all roles (includes dev_admin and service role)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') 
  OR is_dev_admin(auth.uid())
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- 5. Allow admins to insert roles
CREATE POLICY "Admins can insert user_roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') 
  OR is_dev_admin(auth.uid())
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- 6. Allow admins to update roles
CREATE POLICY "Admins can update user_roles"
ON public.user_roles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') 
  OR is_dev_admin(auth.uid())
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- 7. Allow admins to delete roles
CREATE POLICY "Admins can delete user_roles"
ON public.user_roles
FOR DELETE
USING (
  has_role(auth.uid(), 'admin') 
  OR is_dev_admin(auth.uid())
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- 8. Improve has_role function with NULL checks
CREATE OR REPLACE FUNCTION public.has_role(user_id_param uuid, role_name_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add NULL checks to prevent edge cases
  IF user_id_param IS NULL OR role_name_param IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_id_param
    AND r.name = role_name_param
  );
END;
$$;

-- 9. Improve has_permission function with NULL checks
CREATE OR REPLACE FUNCTION public.has_permission(user_id_param uuid, permission_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add NULL checks to prevent edge cases
  IF user_id_param IS NULL OR permission_name IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_id_param
    AND (
      r.permissions @> '["*"]'::jsonb
      OR r.permissions @> jsonb_build_array(permission_name)
    )
  );
END;
$$;

-- 10. Improve is_dev_admin function with NULL checks
CREATE OR REPLACE FUNCTION public.is_dev_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add NULL check
  IF user_id_param IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM feature_flags ff
    JOIN environments e ON ff.environment_id = e.id
    WHERE ff.flag_name = 'dev_admin_access'
      AND ff.is_enabled = true
      AND e.name = 'dev'
  );
END;
$$;