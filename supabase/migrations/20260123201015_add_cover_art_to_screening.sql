-- ============================================================================
-- ADD COVER_ART TO SCREENING SUBMISSIONS FUNCTION
-- ============================================================================
-- Adds the cover_art field from artist_recordings to the get_submissions_with_details
-- function so the screening feed can display album artwork.
-- ============================================================================

-- Drop old version
DROP FUNCTION IF EXISTS get_submissions_with_details(text, text, timestamptz, timestamptz, boolean, integer, boolean, uuid);

-- Create updated function with cover_art
CREATE OR REPLACE FUNCTION get_submissions_with_details(
  p_context text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_genre_mismatch boolean DEFAULT NULL,
  p_min_reviews integer DEFAULT NULL,
  p_exclude_ignored boolean DEFAULT true,
  p_user_id uuid DEFAULT auth.uid()
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
      -- Core submission fields
      'id', ss.id,
      'artist_id', ss.artist_id,
      'recording_id', ss.recording_id,
      'context_type', ss.context_type,
      'event_id', ss.event_id,
      'venue_id', ss.venue_id,
      'status', ss.status,
      'has_genre_mismatch', ss.has_genre_mismatch,
      'decided_by', ss.decided_by,
      'decided_at', ss.decided_at,
      'decision_note', ss.decision_note,
      'created_at', ss.created_at,
      'updated_at', ss.updated_at,

      -- Artist with genres
      'artists', jsonb_build_object(
        'id', a.id,
        'name', a.name,
        'image_url', a.image_url,
        'artist_genres', COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', ag.id,
                'genre_id', ag.genre_id,
                'is_primary', ag.is_primary,
                'genre', jsonb_build_object(
                  'id', g.id,
                  'name', g.name
                )
              ) ORDER BY ag.is_primary DESC, g.name ASC
            )
            FROM artist_genres ag
            INNER JOIN genres g ON ag.genre_id = g.id
            WHERE ag.artist_id = a.id
          ),
          '[]'::jsonb
        )
      ),

      -- Recording details (now includes cover_art)
      'artist_recordings', jsonb_build_object(
        'id', ar.id,
        'name', ar.name,
        'url', ar.url,
        'platform', ar.platform,
        'cover_art', ar.cover_art
      ),

      -- Venue (with required genres if applicable)
      'venues', CASE WHEN ss.venue_id IS NOT NULL THEN
        jsonb_build_object(
          'id', v.id,
          'name', v.name,
          'venue_required_genres', COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object('genre_id', vrg.genre_id)
              )
              FROM venue_required_genres vrg
              WHERE vrg.venue_id = v.id
            ),
            '[]'::jsonb
          )
        )
      ELSE NULL END,

      -- Event (if applicable)
      'events', CASE WHEN ss.event_id IS NOT NULL THEN
        jsonb_build_object(
          'id', e.id,
          'title', e.title,
          'start_time', e.start_time
        )
      ELSE NULL END,

      -- Reviews
      'screening_reviews', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', sr.id,
              'reviewer_id', sr.reviewer_id,
              'rating', sr.rating,
              'internal_notes', sr.internal_notes,
              'listen_duration_seconds', sr.listen_duration_seconds,
              'created_at', sr.created_at,
              'profiles', jsonb_build_object(
                'id', p.id,
                'display_name', p.display_name,
                'avatar_url', p.avatar_url
              )
            ) ORDER BY sr.created_at DESC
          )
          FROM screening_reviews sr
          LEFT JOIN profiles p ON sr.reviewer_id = p.id
          WHERE sr.submission_id = ss.id
        ),
        '[]'::jsonb
      ),

      -- Submission scores (calculated metrics)
      'submission_scores', CASE WHEN scores.submission_id IS NOT NULL THEN
        jsonb_build_object(
          'submission_id', scores.submission_id,
          'review_count', scores.review_count,
          'raw_avg_score', scores.raw_avg_score,
          'confidence_multiplier', scores.confidence_multiplier,
          'confidence_adjusted_score', scores.confidence_adjusted_score,
          'time_decay_multiplier', scores.time_decay_multiplier,
          'hot_score', scores.hot_score,
          'indexed_score', scores.indexed_score,
          'hot_indexed_score', scores.hot_indexed_score,
          'calculated_at', scores.calculated_at
        )
      ELSE NULL END,

      -- Submission tags (with full tag details)
      'submission_tags', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', st.id,
              'tag_id', st.tag_id,
              'tagged_by', st.tagged_by,
              'tagged_at', st.tagged_at,
              'tag', jsonb_build_object(
                'id', t.id,
                'name', t.name,
                'entity_type', t.entity_type,
                'color', t.color,
                'description', t.description,
                'usage_count', t.usage_count
              )
            ) ORDER BY st.tagged_at DESC
          )
          FROM submission_tags st
          INNER JOIN tags t ON st.tag_id = t.id
          WHERE st.submission_id = ss.id
        ),
        '[]'::jsonb
      )
    )
    ORDER BY ss.created_at ASC
  )
  INTO v_results
  FROM screening_submissions ss
  INNER JOIN artists a ON ss.artist_id = a.id
  INNER JOIN artist_recordings ar ON ss.recording_id = ar.id
  LEFT JOIN venues v ON ss.venue_id = v.id
  LEFT JOIN events e ON ss.event_id = e.id
  LEFT JOIN submission_scores scores ON ss.id = scores.submission_id
  WHERE
    -- Existing filters
    (p_context IS NULL OR ss.context_type = p_context)
    AND (p_status IS NULL OR ss.status = p_status)
    AND (p_start_date IS NULL OR ss.created_at >= p_start_date)
    AND (p_end_date IS NULL OR ss.created_at <= p_end_date)
    AND (p_genre_mismatch IS NULL OR ss.has_genre_mismatch = p_genre_mismatch)
    AND (p_min_reviews IS NULL OR COALESCE(scores.review_count, 0) >= p_min_reviews)
    -- Exclude user-ignored submissions if requested
    AND (
      p_exclude_ignored = false OR
      p_user_id IS NULL OR
      NOT EXISTS (
        SELECT 1 FROM user_ignored_submissions uis
        WHERE uis.submission_id = ss.id AND uis.user_id = p_user_id
      )
    );

  RETURN COALESCE(v_results, '[]'::jsonb);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_submissions_with_details(
  text, text, timestamptz, timestamptz, boolean, integer, boolean, uuid
) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_submissions_with_details IS
  'Returns submissions with full details including artist genres, venue required genres, tags, reviews, scores, and recording cover_art.';
