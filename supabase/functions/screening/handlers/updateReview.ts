/**
 * Handler for updating screening reviews
 */

import { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateInput } from '../../_shared/validation.ts';
import { z } from 'https://deno.land/x/zod/mod.ts';

/**
 * Update review schema
 */
export const UpdateReviewSchema = z.object({
  review_id: z.string().uuid(),
  rating: z.number().int().min(1).max(10).optional(),
  metric_scores: z.record(z.string(), z.number()).optional(),
  internal_notes: z.string().max(2000).optional(),
  listen_duration_seconds: z.number().int().nonnegative().optional(),
});

export type UpdateReview = z.infer<typeof UpdateReviewSchema>;

/**
 * Update an existing review
 * Only the reviewer who created the review can update it
 * Note: Submission scores are auto-recalculated via database triggers
 */
export async function updateReview(
  supabase: SupabaseClient,
  user: User,
  params: unknown
) {
  console.log('[updateReview] Starting review update for user:', user.id);
  console.log('[updateReview] Params:', JSON.stringify(params));

  // Validate input
  const reviewData = validateInput(UpdateReviewSchema, params);
  console.log('[updateReview] Validation passed, review_id:', reviewData.review_id);

  // Check if review exists and user is the reviewer
  const { data: existingReview, error: fetchError } = await supabase
    .from('screening_reviews')
    .select('id, reviewer_id, submission_id')
    .eq('id', reviewData.review_id)
    .single();

  if (fetchError || !existingReview) {
    console.error('[updateReview] Review not found:', fetchError);
    throw new Error('Review not found');
  }

  console.log('[updateReview] Review found, reviewer_id:', existingReview.reviewer_id);

  if (existingReview.reviewer_id !== user.id) {
    console.error('[updateReview] User is not the reviewer');
    throw new Error('You can only update your own reviews');
  }

  // Build update object (only include fields that were provided)
  const updateData: Record<string, unknown> = {};
  if (reviewData.rating !== undefined) updateData.rating = reviewData.rating;
  if (reviewData.metric_scores !== undefined) updateData.metric_scores = reviewData.metric_scores;
  if (reviewData.internal_notes !== undefined) updateData.internal_notes = reviewData.internal_notes;
  if (reviewData.listen_duration_seconds !== undefined) {
    updateData.listen_duration_seconds = reviewData.listen_duration_seconds;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('No fields to update');
  }

  console.log('[updateReview] Updating review with:', Object.keys(updateData));

  // Update review
  const { data: review, error: updateError } = await supabase
    .from('screening_reviews')
    .update(updateData)
    .eq('id', reviewData.review_id)
    .select()
    .single();

  if (updateError) {
    console.error('[updateReview] Error updating review:', updateError);
    console.error('[updateReview] Error details:', JSON.stringify(updateError, null, 2));
    throw new Error(`Failed to update review: ${updateError.message}`);
  }

  console.log('[updateReview] Review updated successfully');

  // Scores are auto-recalculated via database triggers
  return review;
}
