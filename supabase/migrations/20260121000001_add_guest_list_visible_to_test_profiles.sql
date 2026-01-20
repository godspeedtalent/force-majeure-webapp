-- ============================================
-- Add guest_list_visible to test_profiles
-- ============================================
-- Adds the guest_list_visible column to test_profiles table
-- to support variation in mock data generation for public/private users.
-- This mirrors the guest_list_visible field in the profiles table.
-- ============================================

-- Add guest_list_visible column with default of true (public by default)
ALTER TABLE test_profiles
ADD COLUMN IF NOT EXISTS guest_list_visible BOOLEAN DEFAULT true;

-- Add avatar_url column to support blurred avatar display for private users
ALTER TABLE test_profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN test_profiles.guest_list_visible IS 'Whether this test profile appears publicly in guest lists. False = private user with blurred avatar.';
COMMENT ON COLUMN test_profiles.avatar_url IS 'Avatar URL for test profile display.';
