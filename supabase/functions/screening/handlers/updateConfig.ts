/**
 * Handler for updating screening configuration
 */

import { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateInput, UpdateConfigSchema } from '../../_shared/validation.ts';
import { requireAnyRole } from '../../_shared/auth.ts';

/**
 * Update screening scoring configuration
 * Requires admin or org_admin role
 */
export async function updateConfig(
  supabase: SupabaseClient,
  user: User,
  params: unknown
) {
  // Only admins can update config (matches RLS policy)
  await requireAnyRole(supabase, user.id, ['admin', 'developer']);

  // Validate input
  const config = validateInput(UpdateConfigSchema, params);

  // Update config (only update fields that are provided)
  const updateData: Record<string, unknown> = {};
  if (config.min_reviews_for_approval !== undefined) {
    updateData.min_reviews_for_approval = config.min_reviews_for_approval;
  }
  if (config.min_listen_time_seconds !== undefined) {
    updateData.min_listen_time_seconds = config.min_listen_time_seconds;
  }
  if (config.min_approval_score !== undefined) {
    updateData.min_approval_score = config.min_approval_score;
  }
  if (config.hot_score_half_life_days !== undefined) {
    updateData.hot_score_half_life_days = config.hot_score_half_life_days;
  }

  const { data, error } = await supabase
    .from('screening_config')
    .update(updateData)
    .eq('id', config.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating config:', error);
    throw new Error(`Failed to update configuration: ${error.message}`);
  }

  return data;
}
