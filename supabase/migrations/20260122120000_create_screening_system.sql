-- ============================================================================
-- ARTIST SCREENING SYSTEM
-- Unified submission and review system for DJ sets
-- ============================================================================
-- Created: 2026-01-22
-- Purpose: Enable FM staff to review and approve artist DJ set submissions
--          for venue bookings and event undercard slots with sophisticated
--          scoring and hidden review system
-- ============================================================================

-- Core submission table (replaces/merges undercard_requests)
CREATE TABLE screening_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  recording_id UUID NOT NULL REFERENCES artist_recordings(id) ON DELETE CASCADE,

  -- Context: where this submission is going
  context_type TEXT NOT NULL CHECK (context_type IN ('general', 'event', 'venue')),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,

  -- Status flow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Calculated flags
  has_genre_mismatch BOOLEAN DEFAULT false,

  -- Decision tracking
  decided_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  decision_note TEXT,  -- Optional note shown to artist

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT submission_context_check CHECK (
    (context_type = 'general' AND event_id IS NULL AND venue_id IS NULL) OR
    (context_type = 'event' AND event_id IS NOT NULL AND venue_id IS NULL) OR
    (context_type = 'venue' AND event_id IS NULL AND venue_id IS NOT NULL)
  ),
  CONSTRAINT unique_submission_per_context UNIQUE (artist_id, recording_id, event_id, venue_id)
);

COMMENT ON TABLE screening_submissions IS 'Artist DJ set submissions for review by FM staff. Supports general discovery, event-specific undercard, and venue-specific contexts.';
COMMENT ON COLUMN screening_submissions.context_type IS 'Submission queue: general (discovery backlog), event (undercard request), venue (venue booking)';
COMMENT ON COLUMN screening_submissions.has_genre_mismatch IS 'Auto-calculated: true if artist genres do not match venue requirements';
COMMENT ON COLUMN screening_submissions.decision_note IS 'Optional note from staff shown to artist after approval/rejection';

-- Staff reviews (hidden until you submit your own)
CREATE TABLE screening_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES screening_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Rating and notes
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  internal_notes TEXT,  -- Staff-only comments

  -- Listen timer tracking
  listen_duration_seconds INTEGER NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One review per reviewer per submission
  CONSTRAINT unique_review UNIQUE (submission_id, reviewer_id)
);

COMMENT ON TABLE screening_reviews IS 'Staff reviews of DJ set submissions. Reviews are hidden from other staff until they submit their own review (prevents bias).';
COMMENT ON COLUMN screening_reviews.listen_duration_seconds IS 'Actual time reviewer listened to the set (enforces 20-minute minimum)';
COMMENT ON COLUMN screening_reviews.internal_notes IS 'Private comments visible only to other FM staff members';

-- Materialized scoring data (auto-calculated via triggers)
CREATE TABLE submission_scores (
  submission_id UUID PRIMARY KEY REFERENCES screening_submissions(id) ON DELETE CASCADE,

  -- Raw metrics
  review_count INTEGER NOT NULL DEFAULT 0,
  raw_avg_score NUMERIC(4,2),  -- Simple average of all ratings

  -- Confidence-adjusted score (accounts for review count)
  confidence_multiplier NUMERIC(4,3),  -- 0.500-1.000 based on review count
  confidence_adjusted_score NUMERIC(4,2),

  -- Time-decay score (for HOT rankings)
  time_decay_multiplier NUMERIC(4,3),  -- 0.500-1.000 based on age
  hot_score NUMERIC(4,2),

  -- Indexed scores (1-100 for display)
  indexed_score INTEGER,  -- All-time score (0-100)
  hot_indexed_score INTEGER,  -- Time-decayed score (0-100)

  -- Timestamps
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE submission_scores IS 'Pre-calculated scoring metrics for submissions. Updated automatically via triggers when reviews change.';
COMMENT ON COLUMN submission_scores.confidence_multiplier IS 'Confidence weight based on review count: 2 reviews=50%, 3=70%, 4=85%, 5+=100%';
COMMENT ON COLUMN submission_scores.time_decay_multiplier IS 'Time decay for HOT rankings: exponential decay to 50% over configured half-life (default 60 days)';
COMMENT ON COLUMN submission_scores.indexed_score IS 'All-time ranking score scaled 1-100 for prominent display';
COMMENT ON COLUMN submission_scores.hot_indexed_score IS 'Time-decayed trending score scaled 1-100 (decays over time)';

-- System configuration (single row, admin-editable)
CREATE TABLE screening_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- Singleton table

  -- Review requirements
  min_reviews_for_approval INTEGER NOT NULL DEFAULT 2,
  min_listen_time_seconds INTEGER NOT NULL DEFAULT 1200,  -- 20 minutes
  min_approval_score NUMERIC(4,2) NOT NULL DEFAULT 7.0,

  -- Confidence scoring parameters
  confidence_tier_2_reviews NUMERIC(4,3) NOT NULL DEFAULT 0.500,  -- 2 reviews = 50% confidence
  confidence_tier_3_reviews NUMERIC(4,3) NOT NULL DEFAULT 0.700,  -- 3 reviews = 70%
  confidence_tier_4_reviews NUMERIC(4,3) NOT NULL DEFAULT 0.850,  -- 4 reviews = 85%
  confidence_tier_5_plus_reviews NUMERIC(4,3) NOT NULL DEFAULT 1.000,  -- 5+ reviews = 100%

  -- Time decay parameters (for HOT rankings)
  hot_score_half_life_days INTEGER NOT NULL DEFAULT 60,  -- Decay to 50% over 60 days
  hot_score_min_multiplier NUMERIC(4,3) NOT NULL DEFAULT 0.500,  -- Never below 50%

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE screening_config IS 'System-wide configuration for artist screening (singleton table). Admin-editable thresholds and scoring parameters.';

-- Insert default config
INSERT INTO screening_config (id) VALUES (1);

-- Venue genre requirements (new feature)
CREATE TABLE venue_required_genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_venue_genre UNIQUE (venue_id, genre_id)
);

COMMENT ON TABLE venue_required_genres IS 'Genre requirements for venue bookings. Artists without matching genres receive warning but can still submit.';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Submission indexes
CREATE INDEX idx_submissions_status ON screening_submissions(status);
CREATE INDEX idx_submissions_context_status ON screening_submissions(context_type, status);
CREATE INDEX idx_submissions_event ON screening_submissions(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_submissions_venue ON screening_submissions(venue_id) WHERE venue_id IS NOT NULL;
CREATE INDEX idx_submissions_artist ON screening_submissions(artist_id);
CREATE INDEX idx_submissions_created_at ON screening_submissions(created_at DESC);

-- Review indexes
CREATE INDEX idx_reviews_submission ON screening_reviews(submission_id);
CREATE INDEX idx_reviews_reviewer ON screening_reviews(reviewer_id);

-- Score indexes (for leaderboards)
CREATE INDEX idx_scores_indexed_desc ON submission_scores(indexed_score DESC) WHERE indexed_score IS NOT NULL;
CREATE INDEX idx_scores_hot_indexed_desc ON submission_scores(hot_indexed_score DESC) WHERE hot_indexed_score IS NOT NULL;

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Calculate all scoring metrics for a submission
CREATE OR REPLACE FUNCTION calculate_submission_score(p_submission_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_review_count INTEGER;
  v_raw_avg NUMERIC(4,2);
  v_confidence_mult NUMERIC(4,3);
  v_confidence_score NUMERIC(4,2);
  v_time_decay_mult NUMERIC(4,3);
  v_hot_score NUMERIC(4,2);
  v_indexed INTEGER;
  v_hot_indexed INTEGER;
  v_age_days NUMERIC;
  v_config RECORD;
BEGIN
  -- Get config
  SELECT * INTO v_config FROM screening_config WHERE id = 1;

  -- Get review count and raw average
  SELECT
    COUNT(*),
    COALESCE(AVG(rating), 0)
  INTO v_review_count, v_raw_avg
  FROM screening_reviews
  WHERE submission_id = p_submission_id;

  -- Calculate confidence multiplier based on review count
  v_confidence_mult := CASE
    WHEN v_review_count >= 5 THEN v_config.confidence_tier_5_plus_reviews
    WHEN v_review_count = 4 THEN v_config.confidence_tier_4_reviews
    WHEN v_review_count = 3 THEN v_config.confidence_tier_3_reviews
    WHEN v_review_count >= 2 THEN v_config.confidence_tier_2_reviews
    ELSE 0.000  -- Not enough reviews
  END;

  -- Calculate confidence-adjusted score
  v_confidence_score := v_raw_avg * v_confidence_mult;

  -- Calculate time decay multiplier
  SELECT
    EXTRACT(EPOCH FROM (NOW() - decided_at)) / 86400.0
  INTO v_age_days
  FROM screening_submissions
  WHERE id = p_submission_id AND decided_at IS NOT NULL;

  IF v_age_days IS NULL THEN
    v_time_decay_mult := 1.000;  -- Not approved yet
  ELSE
    -- Exponential decay: 0.5 + 0.5 * exp(-ln(2) * age_days / half_life_days)
    v_time_decay_mult := GREATEST(
      v_config.hot_score_min_multiplier,
      v_config.hot_score_min_multiplier +
      (1.0 - v_config.hot_score_min_multiplier) *
      EXP(-0.693147 * v_age_days / v_config.hot_score_half_life_days)
    );
  END IF;

  -- Calculate HOT score
  v_hot_score := v_confidence_score * v_time_decay_mult;

  -- Calculate indexed scores (1-100)
  IF v_confidence_score > 0 THEN
    v_indexed := ROUND((v_confidence_score - 1.0) / 9.0 * 100);
    v_hot_indexed := ROUND((v_hot_score - 1.0) / 9.0 * 100);
  ELSE
    v_indexed := 0;
    v_hot_indexed := 0;
  END IF;

  -- Upsert into submission_scores
  INSERT INTO submission_scores (
    submission_id,
    review_count,
    raw_avg_score,
    confidence_multiplier,
    confidence_adjusted_score,
    time_decay_multiplier,
    hot_score,
    indexed_score,
    hot_indexed_score,
    calculated_at
  ) VALUES (
    p_submission_id,
    v_review_count,
    v_raw_avg,
    v_confidence_mult,
    v_confidence_score,
    v_time_decay_mult,
    v_hot_score,
    v_indexed,
    v_hot_indexed,
    NOW()
  )
  ON CONFLICT (submission_id) DO UPDATE SET
    review_count = EXCLUDED.review_count,
    raw_avg_score = EXCLUDED.raw_avg_score,
    confidence_multiplier = EXCLUDED.confidence_multiplier,
    confidence_adjusted_score = EXCLUDED.confidence_adjusted_score,
    time_decay_multiplier = EXCLUDED.time_decay_multiplier,
    hot_score = EXCLUDED.hot_score,
    indexed_score = EXCLUDED.indexed_score,
    hot_indexed_score = EXCLUDED.hot_indexed_score,
    calculated_at = NOW();
END;
$$;

COMMENT ON FUNCTION calculate_submission_score IS 'Calculates all scoring metrics for a submission: raw average, confidence-adjusted, time-decayed HOT score, and indexed 1-100 scores. Called automatically via triggers.';

-- Check for genre mismatch
CREATE OR REPLACE FUNCTION check_genre_mismatch(p_submission_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_has_mismatch BOOLEAN;
BEGIN
  -- Only check for venue-context submissions
  SELECT
    CASE
      WHEN s.context_type != 'venue' THEN false
      WHEN s.venue_id IS NULL THEN false
      WHEN NOT EXISTS (
        SELECT 1
        FROM venue_required_genres vrg
        WHERE vrg.venue_id = s.venue_id
      ) THEN false  -- No genre requirements = no mismatch
      ELSE NOT EXISTS (
        SELECT 1
        FROM venue_required_genres vrg
        INNER JOIN artist_genres ag ON ag.genre_id = vrg.genre_id
        WHERE vrg.venue_id = s.venue_id
          AND ag.artist_id = s.artist_id
      )
    END
  INTO v_has_mismatch
  FROM screening_submissions s
  WHERE s.id = p_submission_id;

  RETURN COALESCE(v_has_mismatch, false);
END;
$$;

COMMENT ON FUNCTION check_genre_mismatch IS 'Checks if artist genres match venue required genres. Returns true if mismatch (no overlap). Only applies to venue-context submissions.';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-calculate scores after review changes
CREATE OR REPLACE FUNCTION trigger_recalculate_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM calculate_submission_score(
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.submission_id
      ELSE NEW.submission_id
    END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER recalculate_score_after_review_insert
AFTER INSERT ON screening_reviews
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_score();

CREATE TRIGGER recalculate_score_after_review_update
AFTER UPDATE ON screening_reviews
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_score();

CREATE TRIGGER recalculate_score_after_review_delete
AFTER DELETE ON screening_reviews
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_score();

-- Auto-check genre mismatch on submission insert/update
CREATE OR REPLACE FUNCTION trigger_check_genre_mismatch()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.has_genre_mismatch := check_genre_mismatch(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_genre_mismatch_on_insert
BEFORE INSERT ON screening_submissions
FOR EACH ROW
EXECUTE FUNCTION trigger_check_genre_mismatch();

CREATE TRIGGER check_genre_mismatch_on_update
BEFORE UPDATE OF venue_id, artist_id ON screening_submissions
FOR EACH ROW
EXECUTE FUNCTION trigger_check_genre_mismatch();

-- ============================================================================
-- UPDATE TIMESTAMP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamps
CREATE TRIGGER set_timestamp_submissions
BEFORE UPDATE ON screening_submissions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_reviews
BEFORE UPDATE ON screening_reviews
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE screening_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_required_genres ENABLE ROW LEVEL SECURITY;

-- GRANTs (permission layer 1)
GRANT SELECT, INSERT ON screening_submissions TO authenticated;
GRANT UPDATE, DELETE ON screening_submissions TO authenticated;
GRANT SELECT, INSERT ON screening_reviews TO authenticated;
GRANT UPDATE, DELETE ON screening_reviews TO authenticated;
GRANT SELECT ON submission_scores TO authenticated;
GRANT SELECT ON screening_config TO authenticated;
GRANT UPDATE ON screening_config TO authenticated;
GRANT SELECT ON venue_required_genres TO authenticated;
GRANT INSERT, UPDATE, DELETE ON venue_required_genres TO authenticated;

-- Submissions: Artists see own, staff see all, public see approved
CREATE POLICY "Artists can view own submissions"
  ON screening_submissions FOR SELECT
  USING (
    artist_id IN (
      SELECT a.id FROM artists a
      INNER JOIN profiles p ON a.user_id = p.user_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Staff can view all submissions"
  ON screening_submissions FOR SELECT
  USING (
    has_role(auth.uid(), 'fm_staff') OR
    has_role(auth.uid(), 'admin') OR
    is_dev_admin(auth.uid())
  );

CREATE POLICY "Public can view approved submissions"
  ON screening_submissions FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Artists can insert submissions"
  ON screening_submissions FOR INSERT
  WITH CHECK (
    artist_id IN (
      SELECT a.id FROM artists a
      INNER JOIN profiles p ON a.user_id = p.user_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Staff can update submissions"
  ON screening_submissions FOR UPDATE
  USING (
    has_role(auth.uid(), 'fm_staff') OR
    has_role(auth.uid(), 'admin') OR
    is_dev_admin(auth.uid())
  );

-- Reviews: Hidden until you submit your own
CREATE POLICY "Reviewers can view own reviews"
  ON screening_reviews FOR SELECT
  USING (reviewer_id = auth.uid());

CREATE POLICY "Reviewers can view others' reviews after submitting"
  ON screening_reviews FOR SELECT
  USING (
    submission_id IN (
      SELECT submission_id
      FROM screening_reviews
      WHERE reviewer_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert reviews"
  ON screening_reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid() AND (
      has_role(auth.uid(), 'fm_staff') OR
      has_role(auth.uid(), 'admin') OR
      is_dev_admin(auth.uid())
    )
  );

CREATE POLICY "Reviewers can update own reviews"
  ON screening_reviews FOR UPDATE
  USING (reviewer_id = auth.uid());

-- Scores: Same as submissions
CREATE POLICY "View scores for accessible submissions"
  ON submission_scores FOR SELECT
  USING (
    submission_id IN (
      SELECT id FROM screening_submissions
      -- Uses submission policies
    )
  );

-- Config: Everyone reads, only admins write
CREATE POLICY "Everyone can view config"
  ON screening_config FOR SELECT
  USING (true);

CREATE POLICY "Admins can update config"
  ON screening_config FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()));

-- Venue genres: Public read, admin write
CREATE POLICY "Everyone can view venue genres"
  ON venue_required_genres FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage venue genres"
  ON venue_required_genres FOR ALL
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()));
