-- Add performer history fields to artist_registrations
-- These are internal-only fields for FM staff to evaluate artists

ALTER TABLE artist_registrations
ADD COLUMN IF NOT EXISTS paid_show_count_group TEXT,
ADD COLUMN IF NOT EXISTS talent_differentiator TEXT,
ADD COLUMN IF NOT EXISTS crowd_sources TEXT;

COMMENT ON COLUMN artist_registrations.paid_show_count_group IS 'Number of paid live shows played (1-5, 6-15, 15-50, 50+)';
COMMENT ON COLUMN artist_registrations.talent_differentiator IS 'What sets the artist apart from peers in the local scene';
COMMENT ON COLUMN artist_registrations.crowd_sources IS 'Local circles the artist draws from as their audience';