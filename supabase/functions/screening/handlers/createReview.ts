/**
 * Handler for creating screening reviews
 */

import { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateInput, CreateReviewSchema } from '../../_shared/validation.ts';

/**
 * Create a new review for a submission
 * Note: Submission scores are auto-calculated via database triggers
 */
export async function createReview(
  supabase: SupabaseClient,
  user: User,
  params: unknown
) {
  // Validate input
  const reviewData = validateInput(CreateReviewSchema, params);

  // Check if submission exists and is pending
  const { data: submission, error: submissionError } = await supabase
    .from('screening_submissions')
    .select('id, status')
    .eq('id', reviewData.submission_id)
    .single();

  if (submissionError || !submission) {
    throw new Error('Submission not found');
  }

  if (submission.status !== 'pending') {
    throw new Error('Cannot review a submission that is not pending');
  }

  // Check if user already reviewed this submission
  const { data: existingReview } = await supabase
    .from('screening_reviews')
    .select('id')
    .eq('submission_id', reviewData.submission_id)
    .eq('reviewer_id', user.id)
    .maybeSingle();

  if (existingReview) {
    throw new Error('You have already reviewed this submission');
  }

  // Insert review
  const { data: review, error: reviewError } = await supabase
    .from('screening_reviews')
    .insert({
      submission_id: reviewData.submission_id,
      reviewer_id: user.id,
      rating: reviewData.rating,
      internal_notes: reviewData.internal_notes,
      listen_duration_seconds: reviewData.listen_duration_seconds,
    })
    .select()
    .single();

  if (reviewError) {
    console.error('Error creating review:', reviewError);
    throw new Error(`Failed to create review: ${reviewError.message}`);
  }

  // Scores are auto-updated via database triggers
  return review;
}
