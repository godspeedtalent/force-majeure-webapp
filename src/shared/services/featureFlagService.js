import { supabase } from '@/shared/api/supabase/client';
import { logger } from '@/shared/services/logger';
export const featureFlagService = {
    /**
     * Check if a feature flag is enabled for a given environment
     */
    async isFeatureEnabled(flagName, environmentName = 'production') {
        try {
            const { data, error } = await supabase
                .from('feature_flags')
                .select(`
          is_enabled,
          environment_id,
          environments!inner(name)
        `)
                .eq('flag_name', flagName)
                .eq('environments.name', environmentName)
                .single();
            if (error) {
                // Flag doesn't exist - default to disabled
                if (error.code === 'PGRST116') {
                    return false;
                }
                logger.error('Error checking feature flag', {
                    error: error.message,
                    source: 'featureFlagService.isFeatureEnabled',
                    flagName,
                    environmentName,
                });
                return false;
            }
            return data?.is_enabled ?? false;
        }
        catch (error) {
            logger.error('Exception checking feature flag', {
                error: error instanceof Error ? error.message : 'Unknown',
                source: 'featureFlagService.isFeatureEnabled',
                flagName,
            });
            return false;
        }
    },
    /**
     * Get all feature flags for an environment
     */
    async getFeatureFlagsForEnvironment(environmentName = 'production') {
        try {
            const { data, error } = await supabase
                .from('feature_flags')
                .select(`
          flag_name,
          is_enabled,
          environments!inner(name)
        `)
                .eq('environments.name', environmentName);
            if (error) {
                logger.error('Error fetching feature flags', {
                    error: error.message,
                    source: 'featureFlagService.getFeatureFlagsForEnvironment',
                    environmentName,
                });
                return {};
            }
            const flags = {};
            for (const flag of data || []) {
                flags[flag.flag_name] = flag.is_enabled;
            }
            return flags;
        }
        catch (error) {
            logger.error('Exception fetching feature flags', {
                error: error instanceof Error ? error.message : 'Unknown',
                source: 'featureFlagService.getFeatureFlagsForEnvironment',
            });
            return {};
        }
    },
    /**
     * Get guest list settings for an event
     */
    async getGuestListSettings(eventId) {
        try {
            const { data, error } = await supabase
                .from('guest_list_settings')
                .select('*')
                .eq('event_id', eventId)
                .single();
            if (error) {
                // Settings don't exist for this event
                if (error.code === 'PGRST116') {
                    return null;
                }
                logger.error('Error fetching guest list settings', {
                    error: error.message,
                    source: 'featureFlagService.getGuestListSettings',
                    eventId,
                });
                return null;
            }
            return data;
        }
        catch (error) {
            logger.error('Exception fetching guest list settings', {
                error: error instanceof Error ? error.message : 'Unknown',
                source: 'featureFlagService.getGuestListSettings',
                eventId,
            });
            return null;
        }
    },
    /**
     * Check if guest list is enabled for an event
     * Checks both the global feature flag and event-specific settings
     */
    async isGuestListEnabledForEvent(eventId, environmentName = 'production') {
        // First check the global feature flag
        const globalEnabled = await this.isFeatureEnabled('guest_list', environmentName);
        if (!globalEnabled) {
            return false;
        }
        // Then check event-specific settings
        const settings = await this.getGuestListSettings(eventId);
        return settings?.is_enabled ?? false;
    },
    /**
     * Update a feature flag's enabled state
     */
    async setFeatureEnabled(flagName, enabled, environmentName = 'production') {
        try {
            // First get the environment ID
            const { data: envData, error: envError } = await supabase
                .from('environments')
                .select('id')
                .eq('name', environmentName)
                .single();
            if (envError || !envData) {
                logger.error('Error finding environment', {
                    error: envError?.message,
                    source: 'featureFlagService.setFeatureEnabled',
                    environmentName,
                });
                return false;
            }
            // Update the flag
            const { error } = await supabase
                .from('feature_flags')
                .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
                .eq('flag_name', flagName)
                .eq('environment_id', envData.id);
            if (error) {
                logger.error('Error updating feature flag', {
                    error: error.message,
                    source: 'featureFlagService.setFeatureEnabled',
                    flagName,
                    enabled,
                });
                return false;
            }
            return true;
        }
        catch (error) {
            logger.error('Exception updating feature flag', {
                error: error instanceof Error ? error.message : 'Unknown',
                source: 'featureFlagService.setFeatureEnabled',
                flagName,
            });
            return false;
        }
    },
};
