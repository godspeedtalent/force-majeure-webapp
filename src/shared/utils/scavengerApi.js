import { supabase } from '@/shared';
import { logger } from '@/shared';
export const claimScavengerReward = async (token, userEmail, displayName, showOnLeaderboard, deviceFingerprint) => {
    try {
        const { data: { session }, } = await supabase.auth.getSession();
        if (!session) {
            throw new Error('Not authenticated');
        }
        const { data, error } = await supabase.functions.invoke('claim-scavenger-reward', {
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
        });
        if (error)
            throw error;
        return data;
    }
    catch (error) {
        logger.error('Error claiming reward:', { error });
        return {
            success: false,
            error: error.message || 'Failed to claim reward',
            message: 'Something went wrong. Please try again.',
        };
    }
};
