-- ============================================================================
-- Fuzzy Search Support with pg_trgm Extension
-- ============================================================================
-- Enables trigram-based fuzzy matching for typo-tolerant search across
-- artists, events, venues, profiles, and organizations tables.
-- ============================================================================

-- Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- GIN Indexes for Trigram Search Performance
-- ============================================================================
-- These indexes use the gin_trgm_ops operator class for efficient
-- similarity searches. GIN indexes are preferred over GIST for read-heavy
-- workloads like search.

-- Artists table - primary searchable field is 'name'
CREATE INDEX IF NOT EXISTS idx_artists_name_trgm
  ON artists USING GIN (name gin_trgm_ops);

-- Events table - searchable fields are 'title' and 'description'
CREATE INDEX IF NOT EXISTS idx_events_title_trgm
  ON events USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_events_description_trgm
  ON events USING GIN (COALESCE(description, '') gin_trgm_ops);

-- Venues table - primary searchable field is 'name'
CREATE INDEX IF NOT EXISTS idx_venues_name_trgm
  ON venues USING GIN (name gin_trgm_ops);

-- Profiles table - searchable fields are 'display_name' and 'full_name'
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_trgm
  ON profiles USING GIN (COALESCE(display_name, '') gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm
  ON profiles USING GIN (COALESCE(full_name, '') gin_trgm_ops);

-- Organizations table - primary searchable field is 'name'
CREATE INDEX IF NOT EXISTS idx_organizations_name_trgm
  ON organizations USING GIN (name gin_trgm_ops);

-- ============================================================================
-- Fuzzy Search Functions
-- ============================================================================
-- These functions provide a consistent API for fuzzy search with similarity
-- scoring. They return results ordered by similarity with a configurable
-- threshold.

-- Search artists by name with fuzzy matching
CREATE OR REPLACE FUNCTION search_artists_fuzzy(
  p_query TEXT,
  p_threshold REAL DEFAULT 0.3,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  bio TEXT,
  image_url TEXT,
  similarity_score REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.bio,
    a.image_url,
    similarity(a.name, p_query) AS similarity_score
  FROM artists a
  WHERE similarity(a.name, p_query) >= p_threshold
     OR a.name ILIKE '%' || p_query || '%'
  ORDER BY similarity_score DESC, a.name ASC
  LIMIT p_limit;
END;
$$;

-- Search events by title with fuzzy matching
CREATE OR REPLACE FUNCTION search_events_fuzzy(
  p_query TEXT,
  p_threshold REAL DEFAULT 0.3,
  p_limit INTEGER DEFAULT 10,
  p_upcoming_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  start_time TIMESTAMPTZ,
  hero_image TEXT,
  venue_id UUID,
  similarity_score REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.description,
    e.start_time,
    e.hero_image,
    e.venue_id,
    GREATEST(
      similarity(e.title, p_query),
      similarity(COALESCE(e.description, ''), p_query) * 0.5
    ) AS similarity_score
  FROM events e
  WHERE (
    similarity(e.title, p_query) >= p_threshold
    OR similarity(COALESCE(e.description, ''), p_query) >= p_threshold
    OR e.title ILIKE '%' || p_query || '%'
    OR e.description ILIKE '%' || p_query || '%'
  )
  AND (NOT p_upcoming_only OR e.start_time >= NOW())
  ORDER BY similarity_score DESC, e.start_time ASC
  LIMIT p_limit;
END;
$$;

-- Search venues by name with fuzzy matching
CREATE OR REPLACE FUNCTION search_venues_fuzzy(
  p_query TEXT,
  p_threshold REAL DEFAULT 0.3,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  city TEXT,
  state TEXT,
  image_url TEXT,
  similarity_score REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.name,
    v.city,
    v.state,
    v.image_url,
    similarity(v.name, p_query) AS similarity_score
  FROM venues v
  WHERE similarity(v.name, p_query) >= p_threshold
     OR v.name ILIKE '%' || p_query || '%'
  ORDER BY similarity_score DESC, v.name ASC
  LIMIT p_limit;
END;
$$;

-- Search profiles by display_name or full_name with fuzzy matching
CREATE OR REPLACE FUNCTION search_profiles_fuzzy(
  p_query TEXT,
  p_threshold REAL DEFAULT 0.3,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  similarity_score REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.display_name,
    p.full_name,
    p.avatar_url,
    GREATEST(
      similarity(COALESCE(p.display_name, ''), p_query),
      similarity(COALESCE(p.full_name, ''), p_query)
    ) AS similarity_score
  FROM profiles p
  WHERE similarity(COALESCE(p.display_name, ''), p_query) >= p_threshold
     OR similarity(COALESCE(p.full_name, ''), p_query) >= p_threshold
     OR p.display_name ILIKE '%' || p_query || '%'
     OR p.full_name ILIKE '%' || p_query || '%'
  ORDER BY similarity_score DESC, COALESCE(p.display_name, p.full_name) ASC
  LIMIT p_limit;
END;
$$;

-- Search organizations by name with fuzzy matching
CREATE OR REPLACE FUNCTION search_organizations_fuzzy(
  p_query TEXT,
  p_threshold REAL DEFAULT 0.3,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  logo_url TEXT,
  similarity_score REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.name,
    o.profile_picture AS logo_url,
    similarity(o.name, p_query) AS similarity_score
  FROM organizations o
  WHERE similarity(o.name, p_query) >= p_threshold
     OR o.name ILIKE '%' || p_query || '%'
  ORDER BY similarity_score DESC, o.name ASC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- Utility function to check if pg_trgm is available
-- ============================================================================
-- This allows client code to detect pg_trgm availability and fallback gracefully

CREATE OR REPLACE FUNCTION is_pg_trgm_available()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
  );
$$;

-- ============================================================================
-- Grant permissions to authenticated users
-- ============================================================================

GRANT EXECUTE ON FUNCTION search_artists_fuzzy TO authenticated;
GRANT EXECUTE ON FUNCTION search_events_fuzzy TO authenticated;
GRANT EXECUTE ON FUNCTION search_venues_fuzzy TO authenticated;
GRANT EXECUTE ON FUNCTION search_profiles_fuzzy TO authenticated;
GRANT EXECUTE ON FUNCTION search_organizations_fuzzy TO authenticated;
GRANT EXECUTE ON FUNCTION is_pg_trgm_available TO authenticated;
GRANT EXECUTE ON FUNCTION is_pg_trgm_available TO anon;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON FUNCTION search_artists_fuzzy IS
  'Fuzzy search artists by name using trigram similarity. Returns results ordered by similarity score.';
COMMENT ON FUNCTION search_events_fuzzy IS
  'Fuzzy search events by title/description using trigram similarity. Optionally filter to upcoming events only.';
COMMENT ON FUNCTION search_venues_fuzzy IS
  'Fuzzy search venues by name using trigram similarity. Returns results ordered by similarity score.';
COMMENT ON FUNCTION search_profiles_fuzzy IS
  'Fuzzy search profiles by display_name or full_name using trigram similarity.';
COMMENT ON FUNCTION search_organizations_fuzzy IS
  'Fuzzy search organizations by name using trigram similarity.';
COMMENT ON FUNCTION is_pg_trgm_available IS
  'Utility function to check if pg_trgm extension is available for fuzzy search.';
