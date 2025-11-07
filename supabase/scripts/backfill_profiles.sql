-- One-time SQL script to backfill missing profiles
-- Run this directly in the Supabase SQL Editor

-- Create profiles for any auth users that don't have a profile yet
INSERT INTO public.profiles (user_id, display_name, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)) as display_name,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Verify the results
SELECT 
  COUNT(*) as total_users,
  COUNT(p.user_id) as users_with_profiles,
  COUNT(*) - COUNT(p.user_id) as users_missing_profiles
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id;
