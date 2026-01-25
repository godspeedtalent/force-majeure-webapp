-- Performance indexes for high-frequency queries
-- These indexes improve query performance for commonly accessed columns

-- Index for artist lookups in event_artists junction table
-- Used by: Artist details pages, event artist listings
CREATE INDEX IF NOT EXISTS idx_event_artists_artist_id
ON event_artists(artist_id);

-- Index for time-based order queries
-- Used by: Analytics, order history, revenue reports
CREATE INDEX IF NOT EXISTS idx_orders_created_at
ON orders(created_at);

-- Index for user profile creation time queries
-- Used by: User analytics, growth metrics
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
ON profiles(created_at);

-- Composite index for user order history queries
-- Used by: Order history pages, user spending reports
CREATE INDEX IF NOT EXISTS idx_orders_user_created
ON orders(user_id, created_at);

-- Index for artist recordings lookups
-- Used by: Artist profile pages, recording listings
CREATE INDEX IF NOT EXISTS idx_artist_recordings_artist_id
ON artist_recordings(artist_id);
