/**
 * Handlers for fetching rankings and reviewer stats
 */

import { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateInput, RankingsQuerySchema } from '../../_shared/validation.ts';

/**
 * Get top-ranked approved submissions
 * Uses database function for efficient sorting and limiting
 */
export async function getRankings(
  supabase: SupabaseClient,
  _user: User,
  params: unknown
) {
  // Validate input
  const query = validateInput(RankingsQuerySchema, params);

  // Call database function to get rankings
  const { data, error } = await supabase.rpc('get_submission_rankings', {
    p_context_type: query.context_type,
    p_limit: query.limit || 50,
  });

  if (error) {
    console.error('Error fetching rankings:', error);
    throw new Error(`Failed to fetch rankings: ${error.message}`);
  }

  return data || [];
}

/**
 * Get reviewer leaderboard statistics
 * Uses database function for aggregation
 */
export async function getReviewerStats(
  supabase: SupabaseClient,
  _user: User,
  _params: unknown
) {
  // Call database function to get reviewer stats
  const { data, error } = await supabase.rpc('get_reviewer_stats');

  if (error) {
    console.error('Error fetching reviewer stats:', error);
    throw new Error(`Failed to fetch reviewer statistics: ${error.message}`);
  }

  return data || [];
}
