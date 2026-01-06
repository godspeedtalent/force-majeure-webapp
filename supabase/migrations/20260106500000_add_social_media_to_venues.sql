-- Add social media columns to venues table
-- Matches the pattern used by artists for consistency

ALTER TABLE venues
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_handle TEXT,
ADD COLUMN IF NOT EXISTS twitter_handle TEXT;

-- Add comments for documentation
COMMENT ON COLUMN venues.instagram_handle IS 'Instagram handle (without @)';
COMMENT ON COLUMN venues.facebook_url IS 'Facebook page URL or handle';
COMMENT ON COLUMN venues.youtube_url IS 'YouTube channel URL or handle';
COMMENT ON COLUMN venues.tiktok_handle IS 'TikTok handle (without @)';
COMMENT ON COLUMN venues.twitter_handle IS 'Twitter/X handle (without @)';
