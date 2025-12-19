import { supabase } from '@/shared';
import { logger } from '@/shared';
// Helper for untyped tables (app_settings not yet in generated types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getAppSettingsTable = () => supabase.from('app_settings');
/**
 * Known app setting keys - use these constants for type safety
 */
export const APP_SETTING_KEYS = {
    CHECKOUT_TIMER_DEFAULT_MINUTES: 'checkout_timer_default_minutes',
};
/**
 * Default values for app settings
 */
export const APP_SETTING_DEFAULTS = {
    [APP_SETTING_KEYS.CHECKOUT_TIMER_DEFAULT_MINUTES]: 10,
};
/**
 * Fetches an app setting by key.
 * Returns the setting value or the default if not found.
 */
export async function fetchAppSetting(settingKey) {
    try {
        // Get 'all' environment ID
        const { data: allEnvData, error: allEnvError } = await supabase
            .from('environments')
            .select('id')
            .eq('name', 'all')
            .single();
        if (allEnvError) {
            logger.error('Failed to fetch "all" environment', { error: allEnvError });
            return APP_SETTING_DEFAULTS[settingKey];
        }
        const { data, error } = await getAppSettingsTable()
            .select('*')
            .eq('setting_key', settingKey)
            .eq('environment_id', allEnvData.id)
            .maybeSingle();
        if (error) {
            logger.error('Error fetching app setting', { error, settingKey });
            return APP_SETTING_DEFAULTS[settingKey];
        }
        if (!data) {
            logger.info('App setting not found, using default', { settingKey });
            return APP_SETTING_DEFAULTS[settingKey];
        }
        // Extract the value from the JSONB structure
        const settingValue = data.setting_value;
        return (settingValue.value ?? APP_SETTING_DEFAULTS[settingKey]);
    }
    catch (error) {
        logger.error('Failed to fetch app setting', {
            error: error instanceof Error ? error.message : 'Unknown',
            settingKey,
        });
        return APP_SETTING_DEFAULTS[settingKey];
    }
}
/**
 * Fetches all app settings for the 'all' environment.
 */
export async function fetchAllAppSettings() {
    try {
        // Get 'all' environment ID
        const { data: allEnvData, error: allEnvError } = await supabase
            .from('environments')
            .select('id')
            .eq('name', 'all')
            .single();
        if (allEnvError) {
            logger.error('Failed to fetch "all" environment', { error: allEnvError });
            return [];
        }
        const { data, error } = await getAppSettingsTable()
            .select('*')
            .eq('environment_id', allEnvData.id)
            .order('setting_key', { ascending: true });
        if (error) {
            logger.error('Error fetching app settings', { error });
            return [];
        }
        return (data || []);
    }
    catch (error) {
        logger.error('Failed to fetch app settings', {
            error: error instanceof Error ? error.message : 'Unknown',
        });
        return [];
    }
}
/**
 * Updates an app setting value.
 * Admin-only operation.
 */
export async function updateAppSetting(settingKey, value) {
    try {
        // Get 'all' environment ID
        const { data: allEnvData, error: allEnvError } = await supabase
            .from('environments')
            .select('id')
            .eq('name', 'all')
            .single();
        if (allEnvError) {
            logger.error('Failed to fetch "all" environment', { error: allEnvError });
            return false;
        }
        const { error } = await getAppSettingsTable()
            .upsert({
            setting_key: settingKey,
            setting_value: { value },
            environment_id: allEnvData.id,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'setting_key,environment_id',
        });
        if (error) {
            logger.error('Error updating app setting', { error, settingKey });
            return false;
        }
        logger.info('App setting updated', { settingKey, value });
        return true;
    }
    catch (error) {
        logger.error('Failed to update app setting', {
            error: error instanceof Error ? error.message : 'Unknown',
            settingKey,
        });
        return false;
    }
}
/**
 * Gets the checkout timer duration in seconds.
 * First checks for per-event override, then falls back to global default.
 */
export async function getCheckoutTimerDuration(eventId) {
    // If eventId is provided, try to get per-event configuration
    if (eventId) {
        try {
            const { data, error } = await supabase
                .from('queue_configurations')
                .select('checkout_timeout_minutes')
                .eq('event_id', eventId)
                .maybeSingle();
            if (!error && data?.checkout_timeout_minutes) {
                // Convert minutes to seconds
                return data.checkout_timeout_minutes * 60;
            }
        }
        catch (error) {
            logger.error('Error fetching queue configuration', {
                error: error instanceof Error ? error.message : 'Unknown',
                eventId,
            });
        }
    }
    // Fall back to global default
    const defaultMinutes = await fetchAppSetting(APP_SETTING_KEYS.CHECKOUT_TIMER_DEFAULT_MINUTES);
    // Convert minutes to seconds
    return defaultMinutes * 60;
}
