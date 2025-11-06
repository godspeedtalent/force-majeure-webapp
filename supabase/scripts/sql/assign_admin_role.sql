-- ========================================
-- Assign Admin Role to Your User
-- ========================================
-- Replace 'YOUR_USER_ID' with your actual user ID
-- You can find your user ID at: https://supabase.com/dashboard/project/orgxcrnnecblhuxjfruy/auth/users

-- First, let's see what user IDs exist
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Then assign admin role to your user
-- REPLACE 'e5f719c1-d1b5-4081-9d46-2cbe0f95509f' WITH YOUR ACTUAL USER ID
INSERT INTO public.user_roles (user_id, role)
VALUES ('e5f719c1-d1b5-4081-9d46-2cbe0f95509f', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the role was added
SELECT * FROM public.user_roles;
