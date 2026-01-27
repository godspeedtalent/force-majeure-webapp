-- ============================================================================
-- FIX: Screening Reviews RLS Infinite Recursion (v2)
-- ============================================================================
-- Issue: The policy "Reviewers can view others' reviews after submitting"
-- was re-introduced with an inline subquery on screening_reviews, causing
-- infinite recursion during RLS evaluation.
--
-- Root cause: Later RLS optimization migrations (phase 6/8) overwrote the
-- fixed policy from 20260124010000 with a broken inline subquery version.
--
-- Fix: Use the existing user_has_reviewed_submission() SECURITY DEFINER
-- function that bypasses RLS to check if user has reviewed.
-- ============================================================================

-- Ensure the helper function exists (may have been dropped)
CREATE OR REPLACE FUNCTION user_has_reviewed_submission(p_submission_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM screening_reviews
    WHERE submission_id = p_submission_id
      AND reviewer_id = p_user_id
  );
END;
$$;

COMMENT ON FUNCTION user_has_reviewed_submission IS
  'Check if user has reviewed a submission. SECURITY DEFINER to bypass RLS and avoid recursion.';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION user_has_reviewed_submission(UUID, UUID) TO authenticated;

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Reviewers can view others' reviews after submitting" ON screening_reviews;

-- Recreate using the SECURITY DEFINER function (no RLS recursion)
-- Also use (SELECT auth.uid()) pattern for performance optimization
CREATE POLICY "Reviewers can view others' reviews after submitting"
  ON screening_reviews FOR SELECT
  USING (
    user_has_reviewed_submission(submission_id, (SELECT auth.uid()))
  );

-- ============================================================================
-- Verification query (run manually to confirm fix):
-- ============================================================================
-- SELECT
--   policyname,
--   pg_get_expr(qual, 'public.screening_reviews'::regclass) as using_clause
-- FROM pg_policies
-- WHERE tablename = 'screening_reviews'
-- ORDER BY policyname;
-- ============================================================================
