-- Drop and recreate the users_complete view to add email_verified field
DROP VIEW IF EXISTS public.users_complete;

CREATE VIEW public.users_complete AS
SELECT
  au.id,
  au.email,
  au.created_at as auth_created_at,
  au.last_sign_in_at,
  au.email_confirmed_at,
  -- Add a boolean verified field based on email_confirmed_at
  (au.email_confirmed_at IS NOT NULL) as is_verified,
  p.user_id,
  p.display_name,
  p.full_name,
  p.avatar_url,
  p.organization_id,
  p.created_at as profile_created_at,
  p.updated_at as profile_updated_at,
  o.name as organization_name,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'role_name', r.name,
        'display_name', r.display_name,
        'permissions', r.permissions
      )
    )
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = au.id
  ) as roles
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
LEFT JOIN organizations o ON p.organization_id = o.id;