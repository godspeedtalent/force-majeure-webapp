-- ============================================================================
-- ADD: metric_scores column to screening_reviews
-- ============================================================================
-- Issue: Frontend sends metric_scores but the column doesn't exist,
-- causing data loss of detailed scoring breakdown.
--
-- Fix: Add JSONB column to store metric scores object.
-- ============================================================================

ALTER TABLE screening_reviews
ADD COLUMN IF NOT EXISTS metric_scores JSONB;

COMMENT ON COLUMN screening_reviews.metric_scores IS 'Detailed metric scores breakdown (musicality, track_selection, mixing, energy, etc.) sent from frontend';
