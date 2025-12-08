import { supabase } from '@/shared/api/supabase/client';
import { logger } from '@/shared/services/logger';

export interface ClaimResult {
  success: boolean;
  claim_position?: number;
  location_name?: string;
  promo_code?: string;
  tokens_remaining?: number;
  validation_count?: number;
  message?: string;
  error?: string;
}

export const claimScavengerReward = async (
  token: string,
  userEmail: string,
  displayName: string,
  showOnLeaderboard: boolean,
  deviceFingerprint?: string
): Promise<ClaimResult> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.functions.invoke(
      'claim-scavenger-reward',
      {
        body: {
          token,
          user_email: userEmail,
          display_name: displayName,
          show_on_leaderboard: showOnLeaderboard,
          device_fingerprint: deviceFingerprint,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (error) throw error;
    return data as ClaimResult;
  } catch (error: any) {
    logger.error('Error claiming reward:', { error });
    return {
      success: false,
      error: error.message || 'Failed to claim reward',
      message: 'Something went wrong. Please try again.',
    };
  }
};
