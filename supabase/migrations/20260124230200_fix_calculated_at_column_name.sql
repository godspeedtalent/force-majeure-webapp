-- ============================================================================
-- FIX: Correct column name in calculate_submission_score()
-- ============================================================================
-- Issue: Function was using last_calculated_at instead of calculated_at
-- Fix: Update the function to use the correct column name
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_submission_score(p_submission_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Get review count and raw average (bypasses RLS due to SECURITY DEFINER)
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

  -- Upsert into submission_scores (using correct column name: calculated_at)
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
    calculated_at = EXCLUDED.calculated_at;
END;
$$;

COMMENT ON FUNCTION calculate_submission_score IS 'Calculate and update all scores for a submission. SECURITY DEFINER to bypass RLS when counting reviews.';
