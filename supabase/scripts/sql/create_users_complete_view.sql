-- Drop existing view if it exists
DROP VIEW IF EXISTS public.users_complete;

-- Create a security definer function to fetch all users (allows access to auth.users)
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
  roles jsonb
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
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
    ) as roles

  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.user_id
  LEFT JOIN public.organizations o ON p.organization_id = o.id;
$$;

-- Create a view that calls the security definer function
CREATE OR REPLACE VIEW public.users_complete AS
SELECT * FROM public.get_all_users();

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;

-- Grant select permission on the view to authenticated users
GRANT SELECT ON public.users_complete TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.get_all_users() IS 'Security definer function to fetch all users with access to auth.users schema';
COMMENT ON VIEW public.users_complete IS 'Complete user information joining auth.users, profiles, organizations, and roles';
