-- ============================================================================
-- FIX: Screening Reviews RLS Infinite Recursion
-- ============================================================================
-- Issue: The policy "Reviewers can view others' reviews after submitting"
-- causes infinite recursion because it queries screening_reviews to check
-- if the user has reviewed, which triggers RLS evaluation again.
--
-- Fix: Use a SECURITY DEFINER function that bypasses RLS to check
-- if the user has submitted a review for a given submission.
-- ============================================================================

-- Create helper function that bypasses RLS to check if user has reviewed
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

COMMENT ON FUNCTION user_has_reviewed_submission IS 'Check if user has reviewed a submission. SECURITY DEFINER to avoid RLS recursion.';

-- Drop the problematic policy
DROP POLICY IF EXISTS "Reviewers can view others' reviews after submitting" ON screening_reviews;

-- Create fixed policy using the helper function
CREATE POLICY "Reviewers can view others' reviews after submitting"
  ON screening_reviews FOR SELECT
  USING (
    user_has_reviewed_submission(submission_id, auth.uid())
  );

-- Also add a policy for staff/admin to always see all reviews
DROP POLICY IF EXISTS "Staff can view all reviews" ON screening_reviews;

CREATE POLICY "Staff can view all reviews"
  ON screening_reviews FOR SELECT
  USING (
    has_role(auth.uid(), 'fm_staff') OR
    has_role(auth.uid(), 'admin') OR
    is_dev_admin(auth.uid())
  );

-- Add delete policy for admins/developers only
DROP POLICY IF EXISTS "Admins can delete reviews" ON screening_reviews;

CREATE POLICY "Admins can delete reviews"
  ON screening_reviews FOR DELETE
  USING (
    has_role(auth.uid(), 'admin') OR
    is_dev_admin(auth.uid())
  );

-- Add delete policy for submissions (admin/developer only)
DROP POLICY IF EXISTS "Admins can delete submissions" ON screening_submissions;

CREATE POLICY "Admins can delete submissions"
  ON screening_submissions FOR DELETE
  USING (
    has_role(auth.uid(), 'admin') OR
    is_dev_admin(auth.uid())
  );
