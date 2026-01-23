-- Migration: Backfill profile display_name for users with NULL username
--
-- Problem: The old handle_new_user trigger (before Nov 2025) had:
--   COALESCE(display_name, NULL) - which doesn't actually fallback
-- The current trigger has:
--   COALESCE(display_name, split_part(email, '@', 1)) - proper email prefix fallback
--
-- Users created before the fix have NULL usernames.

-- Backfill existing profiles with NULL display_name
-- Use email prefix as fallback (same as current trigger behavior)
UPDATE public.profiles p
SET
  display_name = split_part(au.email, '@', 1),
  updated_at = NOW()
FROM auth.users au
WHERE p.user_id = au.id
  AND (p.display_name IS NULL OR p.display_name = '');
