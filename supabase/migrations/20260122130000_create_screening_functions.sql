-- Database functions for artist screening stats aggregation
-- Replaces client-side computation with efficient SQL aggregates

-- ============================================================================
-- Function: get_screening_stats
-- Description: Get aggregated statistics for screening submissions
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
    'pending_count', COUNT(*) FILTER (WHERE status = 'pending'),
    'approved_count', COUNT(*) FILTER (WHERE status = 'approved'),
    'rejected_count', COUNT(*) FILTER (WHERE status = 'rejected'),
    'approval_rate', ROUND(
      (COUNT(*) FILTER (WHERE status = 'approved')::numeric / NULLIF(COUNT(*), 0)) * 100,
      2
    ),
    'avg_review_time_hours', ROUND(
      EXTRACT(EPOCH FROM AVG(decided_at - created_at)) / 3600,
      2
    ) FILTER (WHERE decided_at IS NOT NULL),
    'avg_score', ROUND(
      AVG(overall_score),
      2
    ) FILTER (WHERE overall_score IS NOT NULL),
    'total_reviews', (
      SELECT COUNT(*)
      FROM screening_reviews sr
      WHERE sr.submission_id IN (
        SELECT id FROM screening_submissions
        WHERE (p_context IS NULL OR context_type = p_context)
          AND (p_start_date IS NULL OR created_at >= p_start_date)
          AND (p_end_date IS NULL OR created_at <= p_end_date)
      )
    )
  )
  INTO v_stats
  FROM screening_submissions
  WHERE (p_context IS NULL OR context_type = p_context)
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);

  RETURN v_stats;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_screening_stats(text, timestamptz, timestamptz) TO authenticated;

-- ============================================================================
-- Function: get_reviewer_stats
-- Description: Get leaderboard statistics for reviewers
-- ============================================================================

CREATE OR REPLACE FUNCTION get_reviewer_stats()
RETURNS TABLE (
  reviewer_id uuid,
  reviewer_email text,
  reviewer_name text,
  total_reviews bigint,
  avg_technical_score numeric,
  avg_artistic_score numeric,
  avg_genre_fit_score numeric,
  avg_overall_score numeric,
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
    ROUND(AVG(sr.technical_score), 2) as avg_technical_score,
    ROUND(AVG(sr.artistic_score), 2) as avg_artistic_score,
    ROUND(AVG(sr.genre_fit_score), 2) as avg_genre_fit_score,
    ROUND(
      (AVG(sr.technical_score) + AVG(sr.artistic_score) + AVG(sr.genre_fit_score)) / 3,
      2
    ) as avg_overall_score,
    ROUND(
      EXTRACT(EPOCH FROM AVG(sr.created_at - ss.created_at)) / 60,
      2
    ) as avg_review_time_minutes
  FROM screening_reviews sr
  JOIN screening_submissions ss ON sr.submission_id = ss.id
  JOIN profiles p ON sr.reviewer_id = p.user_id
  GROUP BY sr.reviewer_id, p.email, p.display_name
  ORDER BY total_reviews DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_reviewer_stats() TO authenticated;

-- ============================================================================
-- Function: get_submission_rankings
-- Description: Get top-ranked approved submissions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_submission_rankings(
  p_context_type text,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  submission_id uuid,
  artist_id uuid,
  artist_name text,
  genre text,
  overall_score numeric,
  review_count bigint,
  decided_at timestamptz,
  spotify_url text,
  soundcloud_url text
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
    a.genre,
    ss.overall_score,
    ss.review_count,
    ss.decided_at,
    a.spotify_url,
    a.soundcloud_url
  FROM screening_submissions ss
  JOIN artists a ON ss.artist_id = a.id
  WHERE ss.status = 'approved'
    AND ss.context_type = p_context_type
    AND ss.overall_score IS NOT NULL
  ORDER BY ss.overall_score DESC, ss.decided_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_submission_rankings(text, integer) TO authenticated;

-- ============================================================================
-- Function: get_submissions_with_details
-- Description: Get submissions with all related data (replaces complex client joins)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_submissions_with_details(
  p_context text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_genre_mismatch boolean DEFAULT NULL,
  p_min_reviews integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_results jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ss.id,
      'artist_id', ss.artist_id,
      'context_type', ss.context_type,
      'venue_id', ss.venue_id,
      'status', ss.status,
      'overall_score', ss.overall_score,
      'review_count', ss.review_count,
      'created_at', ss.created_at,
      'decided_at', ss.decided_at,
      'decided_by', ss.decided_by,
      'decision_notes', ss.decision_notes,
      'artist', jsonb_build_object(
        'id', a.id,
        'name', a.name,
        'genre', a.genre,
        'bio', a.bio,
        'spotify_url', a.spotify_url,
        'soundcloud_url', a.soundcloud_url,
        'instagram_handle', a.instagram_handle,
        'image_url', a.image_url
      ),
      'recordings', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', ar.id,
              'title', ar.title,
              'url', ar.url,
              'recording_type', ar.recording_type,
              'duration_seconds', ar.duration_seconds
            )
          )
          FROM artist_recordings ar
          WHERE ar.artist_id = a.id
        ),
        '[]'::jsonb
      ),
      'reviews', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', sr.id,
              'reviewer_id', sr.reviewer_id,
              'technical_score', sr.technical_score,
              'artistic_score', sr.artistic_score,
              'genre_fit_score', sr.genre_fit_score,
              'comments', sr.comments,
              'genre_tags', sr.genre_tags,
              'red_flags', sr.red_flags,
              'created_at', sr.created_at,
              'reviewer', jsonb_build_object(
                'email', p.email,
                'display_name', p.display_name
              )
            )
          )
          FROM screening_reviews sr
          JOIN profiles p ON sr.reviewer_id = p.user_id
          WHERE sr.submission_id = ss.id
        ),
        '[]'::jsonb
      )
    )
  )
  INTO v_results
  FROM screening_submissions ss
  JOIN artists a ON ss.artist_id = a.id
  WHERE (p_context IS NULL OR ss.context_type = p_context)
    AND (p_status IS NULL OR ss.status = p_status)
    AND (p_start_date IS NULL OR ss.created_at >= p_start_date)
    AND (p_end_date IS NULL OR ss.created_at <= p_end_date)
    AND (p_genre_mismatch IS NULL OR
      CASE
        WHEN p_genre_mismatch THEN
          EXISTS (
            SELECT 1 FROM screening_reviews sr
            WHERE sr.submission_id = ss.id
            AND sr.genre_tags IS NOT NULL
            AND NOT (a.genre = ANY(sr.genre_tags))
          )
        ELSE TRUE
      END
    )
    AND (p_min_reviews IS NULL OR ss.review_count >= p_min_reviews);

  RETURN COALESCE(v_results, '[]'::jsonb);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_submissions_with_details(
  text, text, timestamptz, timestamptz, boolean, integer
) TO authenticated;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION get_screening_stats IS
  'Returns aggregated statistics for screening submissions with optional filters';

COMMENT ON FUNCTION get_reviewer_stats IS
  'Returns reviewer leaderboard with review counts and average scores';

COMMENT ON FUNCTION get_submission_rankings IS
  'Returns top-ranked approved submissions for a given context';

COMMENT ON FUNCTION get_submissions_with_details IS
  'Returns submissions with full artist, recording, and review details (replaces client-side joins)';
