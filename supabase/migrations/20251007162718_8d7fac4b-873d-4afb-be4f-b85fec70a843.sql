-- Add admin role to ben@forcemajeure.vip
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'ben@forcemajeure.vip'
ON CONFLICT (user_id, role) DO NOTHING;