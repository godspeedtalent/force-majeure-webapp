/**
 * Handler for fetching screening statistics
 */

import { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateInput, StatsQuerySchema } from '../../_shared/validation.ts';

/**
 * Get aggregated statistics for screening submissions
 * Uses database function for efficient SQL aggregates
 */
export async function getStats(
  supabase: SupabaseClient,
  _user: User,
  params: unknown
) {
  // Validate input
  const query = validateInput(StatsQuerySchema, params);

  // Call database function to get aggregated stats
  const { data, error } = await supabase.rpc('get_screening_stats', {
    p_context: query.context || null,
    p_start_date: query.startDate || null,
    p_end_date: query.endDate || null,
  });

  if (error) {
    console.error('Error fetching stats:', error);
    throw new Error(`Failed to fetch statistics: ${error.message}`);
  }

  return data;
}
