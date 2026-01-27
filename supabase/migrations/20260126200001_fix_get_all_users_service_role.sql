-- =====================================================
-- Fix get_all_users() to allow service_role access
-- =====================================================
-- The previous migration added an auth check using auth.uid(), but when the
-- edge function uses service_role, auth.uid() returns null, causing the check to fail.
-- Service role should be allowed since it's only used by trusted edge functions
-- that already perform their own authorization checks.

-- Step 1: Drop the view that depends on the function
DROP VIEW IF EXISTS public.users_complete;

-- Step 2: Drop the existing function
DROP FUNCTION IF EXISTS public.get_all_users();

-- Step 3: Recreate the function with proper service_role handling
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  auth_created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  user_id uuid,
  display_name text,
  full_name text,
  avatar_url text,
  spotify_connected boolean,
  spotify_token_expires_at timestamptz,
  organization_id uuid,
  profile_created_at timestamptz,
  profile_updated_at timestamptz,
  organization_name text,
  roles jsonb,
  is_verified boolean
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user ID (will be null for service_role)
  current_user_id := auth.uid();

  -- Authorization check:
  -- 1. Allow if no auth context (service_role) - service_role is only used by trusted edge functions
  -- 2. Allow if user is admin or developer
  IF current_user_id IS NOT NULL AND NOT (
    public.has_role(current_user_id, 'admin') OR
    public.has_role(current_user_id, 'developer')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin or developer role required to access user data';
  END IF;

  RETURN QUERY
  SELECT
    -- Auth user fields
    au.id,
    au.email,
    au.created_at as auth_created_at,
    au.last_sign_in_at,
    au.email_confirmed_at,

    -- Profile fields
    p.user_id,
    p.display_name,
    p.full_name,
    p.avatar_url,
    p.spotify_connected,
    p.spotify_token_expires_at,
    p.organization_id,
    p.created_at as profile_created_at,
    p.updated_at as profile_updated_at,

    -- Organization fields
    o.name as organization_name,

    -- Aggregated roles
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'role_name', r.name,
          'display_name', r.display_name,
          'permissions', r.permissions
        )
      )
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = au.id
    ) as roles,

    -- Verified status from profiles
    COALESCE(p.is_verified, false) as is_verified

  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.user_id
  LEFT JOIN public.organizations o ON p.organization_id = o.id;
END;
$$;

-- Step 4: Recreate the view
CREATE OR REPLACE VIEW public.users_complete AS
SELECT * FROM public.get_all_users();

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO service_role;
GRANT SELECT ON public.users_complete TO authenticated;
GRANT SELECT ON public.users_complete TO service_role;

-- Update comment to reflect security model
COMMENT ON FUNCTION public.get_all_users() IS
'Security definer function to fetch all users.
SECURITY:
- Service role has unrestricted access (used by trusted edge functions)
- Authenticated users require admin or developer role
Regular authenticated users will receive an authorization error.';

COMMENT ON VIEW public.users_complete IS
'Complete user information joining auth.users, profiles, organizations, and roles.
SECURITY: Only accessible by service_role or users with admin/developer roles.';
