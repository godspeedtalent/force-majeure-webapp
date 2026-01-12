-- ============================================================================
-- Improve Event Search to Include Headliner Artist Name
-- ============================================================================
-- Updates the search_events_fuzzy function to JOIN with the artists table
-- so that searching for an artist name will also find events where they
-- are the headliner.
-- ============================================================================

-- Must DROP first because we're changing the return type (adding headliner_name)
DROP FUNCTION IF EXISTS search_events_fuzzy(TEXT, REAL, INTEGER, BOOLEAN);

-- Recreate search_events_fuzzy with headliner name in search
CREATE FUNCTION search_events_fuzzy(
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
  headliner_name TEXT,
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
    a.name AS headliner_name,
    GREATEST(
      similarity(e.title, p_query),
      similarity(COALESCE(e.description, ''), p_query) * 0.5,
      similarity(COALESCE(a.name, ''), p_query) * 0.9  -- High weight for headliner match
    ) AS similarity_score
  FROM events e
  LEFT JOIN artists a ON e.headliner_id = a.id
  WHERE (
    similarity(e.title, p_query) >= p_threshold
    OR similarity(COALESCE(e.description, ''), p_query) >= p_threshold
    OR similarity(COALESCE(a.name, ''), p_query) >= p_threshold
    OR e.title ILIKE '%' || p_query || '%'
    OR e.description ILIKE '%' || p_query || '%'
    OR a.name ILIKE '%' || p_query || '%'
  )
  AND e.status = 'published'  -- Only return published events
  AND (NOT p_upcoming_only OR e.start_time >= NOW())
  ORDER BY similarity_score DESC, e.start_time ASC
  LIMIT p_limit;
END;
$$;

-- Re-grant permissions (dropped with the function)
GRANT EXECUTE ON FUNCTION search_events_fuzzy TO authenticated;

-- Update comment to reflect the change
COMMENT ON FUNCTION search_events_fuzzy IS
  'Fuzzy search events by title, description, or headliner artist name using trigram similarity. Optionally filter to upcoming events only.';
