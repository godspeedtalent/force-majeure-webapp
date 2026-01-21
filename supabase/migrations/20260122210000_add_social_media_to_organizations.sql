-- Add social media columns to organizations table
-- Matches the pattern used by venues for consistency

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS social_email TEXT,
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_handle TEXT,
ADD COLUMN IF NOT EXISTS twitter_handle TEXT;

-- Add comments for documentation
COMMENT ON COLUMN organizations.website IS 'Organization website URL';
COMMENT ON COLUMN organizations.social_email IS 'Contact email for social/public display';
COMMENT ON COLUMN organizations.instagram_handle IS 'Instagram handle (without @)';
COMMENT ON COLUMN organizations.facebook_url IS 'Facebook page URL or handle';
COMMENT ON COLUMN organizations.youtube_url IS 'YouTube channel URL or handle';
COMMENT ON COLUMN organizations.tiktok_handle IS 'TikTok handle (without @)';
COMMENT ON COLUMN organizations.twitter_handle IS 'Twitter/X handle (without @)';
