/**
 * Handlers for fetching screening submissions
 */

import { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateInput, SubmissionFiltersSchema, UuidSchema } from '../../_shared/validation.ts';

/**
 * Get all submissions with optional filters
 * Uses database function for efficient server-side filtering and joins
 */
export async function getSubmissions(
  supabase: SupabaseClient,
  _user: User,
  params: unknown
) {
  // Validate input
  const filters = validateInput(SubmissionFiltersSchema, params);

  // Call database function to get submissions with full details
  const { data, error } = await supabase.rpc('get_submissions_with_details', {
    p_context: filters.context || null,
    p_status: filters.status || null,
    p_start_date: filters.startDate || null,
    p_end_date: filters.endDate || null,
    p_genre_mismatch: filters.genreMismatch || null,
    p_min_reviews: filters.minReviews || null,
  });

  if (error) {
    console.error('Error fetching submissions:', error);
    throw new Error(`Failed to fetch submissions: ${error.message}`);
  }

  // Database function returns jsonb, parse it
  return data || [];
}

/**
 * Get single submission by ID with full details
 */
export async function getSubmission(
  supabase: SupabaseClient,
  _user: User,
  params: unknown
) {
  // Validate input
  const { id } = validateInput(
    UuidSchema.transform(id => ({ id })),
    params
  );

  // Fetch submission with all related data
  const { data, error } = await supabase
    .from('screening_submissions')
    .select(`
      *,
      artist:artists!inner (
        id,
        name,
        genre,
        bio,
        spotify_url,
        soundcloud_url,
        instagram_handle,
        image_url,
        recordings:artist_recordings (
          id,
          title,
          url,
          recording_type,
          duration_seconds
        )
      ),
      reviews:screening_reviews (
        id,
        reviewer_id,
        technical_score,
        artistic_score,
        genre_fit_score,
        comments,
        genre_tags,
        red_flags,
        created_at,
        reviewer:profiles!reviewer_id (
          email,
          display_name
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Not found: Submission not found');
    }
    console.error('Error fetching submission:', error);
    throw new Error(`Failed to fetch submission: ${error.message}`);
  }

  return data;
}
