-- Add missing social media columns to artists table
-- Adds twitter_handle, facebook_url, and youtube_url to match venues

ALTER TABLE artists
ADD COLUMN IF NOT EXISTS twitter_handle TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN artists.twitter_handle IS 'Twitter/X handle (without @)';
COMMENT ON COLUMN artists.facebook_url IS 'Facebook page URL or handle';
COMMENT ON COLUMN artists.youtube_url IS 'YouTube channel URL or handle';

-- Also add to artist_registrations for consistency
ALTER TABLE artist_registrations
ADD COLUMN IF NOT EXISTS twitter_handle TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT;

COMMENT ON COLUMN artist_registrations.twitter_handle IS 'Twitter/X handle (without @)';
COMMENT ON COLUMN artist_registrations.facebook_url IS 'Facebook page URL or handle';
COMMENT ON COLUMN artist_registrations.youtube_url IS 'YouTube channel URL or handle';
