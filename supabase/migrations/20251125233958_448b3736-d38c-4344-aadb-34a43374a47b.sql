-- Grant INSERT permission for authenticated users to artist_genres table
GRANT INSERT ON artist_genres TO authenticated;

-- The existing RLS policies already handle the permission checks
-- This just ensures authenticated users can attempt the insert
-- which will then be filtered by the existing RLS policies