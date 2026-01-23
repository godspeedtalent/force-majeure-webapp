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
  console.log('[getSubmissions] Calling RPC with filters:', JSON.stringify(filters));

  const { data, error } = await supabase.rpc('get_submissions_with_details', {
    p_context: filters.context || null,
    p_status: filters.status || null,
    p_start_date: filters.startDate || null,
    p_end_date: filters.endDate || null,
    p_genre_mismatch: filters.genreMismatch || null,
    p_min_reviews: filters.minReviews || null,
  });

  console.log('[getSubmissions] RPC result:', {
    hasData: !!data,
    dataLength: Array.isArray(data) ? data.length : 'not array',
    error: error?.message || null,
    errorCode: error?.code || null
  });

  if (error) {
    console.error('[getSubmissions] Error fetching submissions:', error);
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
  // Validate input - params is { id: string }
  const paramsObj = params as { id?: unknown };
  const id = validateInput(UuidSchema, paramsObj?.id);

  console.log('[getSubmission] Fetching submission:', id);

  // Fetch submission with all related data
  // Schema updated to match actual screening_reviews table structure
  const { data, error } = await supabase
    .from('screening_submissions')
    .select(`
      *,
      artists!inner (
        id,
        name,
        image_url,
        artist_genres (
          id,
          genre_id,
          is_primary,
          genres (
            id,
            name
          )
        )
      ),
      artist_recordings!inner (
        id,
        name,
        url,
        platform,
        duration_seconds
      ),
      screening_reviews (
        id,
        reviewer_id,
        rating,
        internal_notes,
        listen_duration_seconds,
        created_at,
        profiles (
          id,
          display_name,
          avatar_url
        )
      ),
      submission_scores (
        review_count,
        raw_avg_score,
        confidence_adjusted_score,
        indexed_score,
        hot_indexed_score
      ),
      venues (
        id,
        name
      ),
      events (
        id,
        title,
        start_time
      )
    `)
    .eq('id', id)
    .single();

  console.log('[getSubmission] Result:', {
    hasData: !!data,
    error: error?.message || null,
    errorCode: error?.code || null
  });

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Not found: Submission not found');
    }
    console.error('Error fetching submission:', error);
    throw new Error(`Failed to fetch submission: ${error.message}`);
  }

  return data;
}
