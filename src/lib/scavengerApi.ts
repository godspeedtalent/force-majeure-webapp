import { supabase } from "@/integrations/supabase/client";

export interface ValidationResult {
  valid: boolean;
  location_id?: string;
  location_name?: string;
  location_description?: string;
  reward_type?: string;
  tokens_remaining?: number;
  total_tokens?: number;
  promo_code?: string;
  error?: string;
  message?: string;
}

export interface ClaimResult {
  success: boolean;
  claim_position?: number;
  location_name?: string;
  reward_type?: string;
  promo_code?: string;
  tokens_remaining?: number;
  message?: string;
  error?: string;
}

export const validateScavengerToken = async (token: string): Promise<ValidationResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('validate-scavenger-token', {
      body: { token }
    });

    if (error) throw error;
    return data as ValidationResult;
  } catch (error: any) {
    console.error('Error validating token:', error);
    return {
      valid: false,
      error: error.message || 'Failed to validate token',
      message: 'Something went wrong. Please try again.'
    };
  }
};

export const claimScavengerReward = async (
  token: string,
  userEmail: string,
  displayName: string,
  showOnLeaderboard: boolean,
  deviceFingerprint?: string
): Promise<ClaimResult> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('claim-scavenger-reward', {
      body: { 
        token, 
        user_email: userEmail,
        display_name: displayName,
        show_on_leaderboard: showOnLeaderboard,
        device_fingerprint: deviceFingerprint
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) throw error;
    return data as ClaimResult;
  } catch (error: any) {
    console.error('Error claiming reward:', error);
    return {
      success: false,
      error: error.message || 'Failed to claim reward',
      message: 'Something went wrong. Please try again.'
    };
  }
};
