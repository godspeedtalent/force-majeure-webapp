-- ============================================================================
-- FIX SCREENING ANALYTICS FUNCTIONS SCHEMA MISMATCH
-- ============================================================================
-- The original screening functions reference columns from an old schema that
-- don't exist in production:
--   - screening_submissions.overall_score → use submission_scores.indexed_score
--   - screening_submissions.review_count → use submission_scores.review_count
--   - screening_reviews.technical_score/artistic_score/genre_fit_score → use rating
--   - artists.spotify_url/soundcloud_url → don't exist, use spotify_data
--
-- This migration recreates the functions with correct schema.
-- ============================================================================

-- ============================================================================
-- Function: get_screening_stats (FIXED)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_screening_stats(
  p_context text DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_submissions', COUNT(*),
    'pending_count', COUNT(*) FILTER (WHERE ss.status = 'pending'),
    'approved_count', COUNT(*) FILTER (WHERE ss.status = 'approved'),
    'rejected_count', COUNT(*) FILTER (WHERE ss.status = 'rejected'),
    'approval_rate', ROUND(
      (COUNT(*) FILTER (WHERE ss.status = 'approved')::numeric / NULLIF(COUNT(*), 0)) * 100,
      2
    ),
    'avg_review_time_hours', ROUND(
      EXTRACT(EPOCH FROM AVG(ss.decided_at - ss.created_at)) / 3600,
      2
    ) FILTER (WHERE ss.decided_at IS NOT NULL),
    -- Use submission_scores for avg score (indexed_score is 0-100)
    'avg_score', (
      SELECT ROUND(AVG(sc.indexed_score), 2)
      FROM submission_scores sc
      INNER JOIN screening_submissions sub ON sc.submission_id = sub.id
      WHERE (p_context IS NULL OR sub.context_type = p_context)
        AND (p_start_date IS NULL OR sub.created_at >= p_start_date)
        AND (p_end_date IS NULL OR sub.created_at <= p_end_date)
        AND sc.indexed_score IS NOT NULL
    ),
    'total_reviews', (
      SELECT COUNT(*)
      FROM screening_reviews sr
      INNER JOIN screening_submissions sub ON sr.submission_id = sub.id
      WHERE (p_context IS NULL OR sub.context_type = p_context)
        AND (p_start_date IS NULL OR sub.created_at >= p_start_date)
        AND (p_end_date IS NULL OR sub.created_at <= p_end_date)
    )
  )
  INTO v_stats
  FROM screening_submissions ss
  WHERE (p_context IS NULL OR ss.context_type = p_context)
    AND (p_start_date IS NULL OR ss.created_at >= p_start_date)
    AND (p_end_date IS NULL OR ss.created_at <= p_end_date);

  RETURN v_stats;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_screening_stats(text, timestamptz, timestamptz) TO authenticated;

-- ============================================================================
-- Function: get_reviewer_stats (FIXED)
-- Uses single 'rating' column instead of technical/artistic/genre scores
-- ============================================================================

DROP FUNCTION IF EXISTS get_reviewer_stats();

CREATE OR REPLACE FUNCTION get_reviewer_stats()
RETURNS TABLE (
  reviewer_id uuid,
  reviewer_email text,
  reviewer_name text,
  total_reviews bigint,
  avg_rating numeric,
  avg_listen_time_seconds numeric,
  avg_review_time_minutes numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sr.reviewer_id,
    p.email as reviewer_email,
    COALESCE(p.display_name, p.email) as reviewer_name,
    COUNT(sr.id) as total_reviews,
    ROUND(AVG(sr.rating), 2) as avg_rating,
    ROUND(AVG(sr.listen_duration_seconds), 0) as avg_listen_time_seconds,
    ROUND(
      EXTRACT(EPOCH FROM AVG(sr.created_at - ss.created_at)) / 60,
      2
    ) as avg_review_time_minutes
  FROM screening_reviews sr
  INNER JOIN screening_submissions ss ON sr.submission_id = ss.id
  INNER JOIN profiles p ON sr.reviewer_id = p.id
  GROUP BY sr.reviewer_id, p.email, p.display_name
  ORDER BY total_reviews DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_reviewer_stats() TO authenticated;

-- ============================================================================
-- Function: get_submission_rankings (FIXED)
-- Uses submission_scores table for scores, artist_genres for genres
-- ============================================================================

DROP FUNCTION IF EXISTS get_submission_rankings(text, integer);

CREATE OR REPLACE FUNCTION get_submission_rankings(
  p_context_type text,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  submission_id uuid,
  artist_id uuid,
  artist_name text,
  indexed_score integer,
  hot_indexed_score integer,
  review_count integer,
  decided_at timestamptz,
  recording_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ss.id as submission_id,
    a.id as artist_id,
    a.name as artist_name,
    sc.indexed_score,
    sc.hot_indexed_score,
    sc.review_count,
    ss.decided_at,
    ar.url as recording_url
  FROM screening_submissions ss
  INNER JOIN artists a ON ss.artist_id = a.id
  INNER JOIN submission_scores sc ON ss.id = sc.submission_id
  LEFT JOIN artist_recordings ar ON ss.recording_id = ar.id
  WHERE ss.status = 'approved'
    AND ss.context_type = p_context_type
    AND sc.indexed_score IS NOT NULL
  ORDER BY sc.indexed_score DESC, ss.decided_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_submission_rankings(text, integer) TO authenticated;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION get_screening_stats IS
  'Returns aggregated statistics for screening submissions. Fixed to use submission_scores table for score data.';

COMMENT ON FUNCTION get_reviewer_stats IS
  'Returns reviewer leaderboard with review counts and average ratings. Fixed to use single rating column.';

COMMENT ON FUNCTION get_submission_rankings IS
  'Returns top-ranked approved submissions. Fixed to use submission_scores table for scores.';
