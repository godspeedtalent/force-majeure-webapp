-- Create a function to get all user profiles with emails for admins
-- This function queries auth.users which requires security definer

CREATE OR REPLACE FUNCTION public.get_all_users_with_email()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name TEXT,
  full_name TEXT,
  gender TEXT,
  age_range TEXT,
  home_city TEXT,
  avatar_url TEXT,
  billing_address TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_zip TEXT,
  stripe_customer_id TEXT,
  organization_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  email TEXT,
  roles TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin or developer
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin()) THEN
    RAISE EXCEPTION 'Only admins can access this function';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.full_name,
    p.gender,
    p.age_range,
    p.home_city,
    p.avatar_url,
    p.billing_address,
    p.billing_city,
    p.billing_state,
    p.billing_zip,
    p.stripe_customer_id,
    p.organization_id,
    p.created_at,
    p.updated_at,
    COALESCE(au.email, 'N/A') as email,
    ARRAY(
      SELECT r.role_name 
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = p.id
    ) as roles
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_all_users_with_email() IS 
  'Admin function to retrieve all user profiles with their email addresses and roles';

-- Grant execute permission to authenticated users (function checks admin role internally)
GRANT EXECUTE ON FUNCTION public.get_all_users_with_email() TO authenticated;
