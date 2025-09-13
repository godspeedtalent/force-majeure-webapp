-- Remove plaintext token columns after migration to encrypted storage
-- This completes the security fix by removing the vulnerable plaintext columns

ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS spotify_access_token,
DROP COLUMN IF EXISTS spotify_refresh_token;

-- Add comment to document the security improvement
COMMENT ON TABLE public.profiles IS 'User profiles table with encrypted Spotify token storage for enhanced security';