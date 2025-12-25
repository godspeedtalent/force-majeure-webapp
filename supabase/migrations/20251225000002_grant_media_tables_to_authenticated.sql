-- Grant permissions to authenticated role on media tables
-- Root cause: RLS policies exist but the authenticated role has no base GRANTs on these tables

-- Grant all CRUD operations on media_galleries
GRANT SELECT, INSERT, UPDATE, DELETE ON media_galleries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON media_galleries TO anon;

-- Grant all CRUD operations on media_items
GRANT SELECT, INSERT, UPDATE, DELETE ON media_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON media_items TO anon;

-- Grant all CRUD operations on artist_recordings
GRANT SELECT, INSERT, UPDATE, DELETE ON artist_recordings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON artist_recordings TO anon;

-- Note: RLS policies still control actual access - these GRANTs just allow
-- the authenticated/anon roles to attempt operations that RLS then filters
