import { supabase } from '@/shared';
import { logger } from '@/shared';

// Helper for untyped tables (app_settings not yet in generated types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getAppSettingsTable = () => (supabase as any).from('app_settings');

/**
 * Known app setting keys - use these constants for type safety
 */
export const APP_SETTING_KEYS = {
  CHECKOUT_TIMER_DEFAULT_MINUTES: 'checkout_timer_default_minutes',
} as const;

export type AppSettingKey = (typeof APP_SETTING_KEYS)[keyof typeof APP_SETTING_KEYS];

export interface AppSetting {
  id: string;
  setting_key: string;
  setting_value: Record<string, unknown>;
  description: string | null;
  environment_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Default values for app settings
 */
export const APP_SETTING_DEFAULTS: Record<AppSettingKey, unknown> = {
  [APP_SETTING_KEYS.CHECKOUT_TIMER_DEFAULT_MINUTES]: 10,
};

/**
 * Fetches an app setting by key.
 * Returns the setting value or the default if not found.
 */
export async function fetchAppSetting<T = unknown>(
  settingKey: AppSettingKey
): Promise<T> {
  try {
    // Get 'all' environment ID
    const { data: allEnvData, error: allEnvError } = await supabase
      .from('environments')
      .select('id')
      .eq('name', 'all')
      .single();

    if (allEnvError) {
      logger.error('Failed to fetch "all" environment', { error: allEnvError });
      return APP_SETTING_DEFAULTS[settingKey] as T;
    }

    const { data, error } = await getAppSettingsTable()
      .select('*')
      .eq('setting_key', settingKey)
      .eq('environment_id', allEnvData.id)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching app setting', { error, settingKey });
      return APP_SETTING_DEFAULTS[settingKey] as T;
    }

    if (!data) {
      logger.info('App setting not found, using default', { settingKey });
      return APP_SETTING_DEFAULTS[settingKey] as T;
    }

    // Extract the value from the JSONB structure
    const settingValue = data.setting_value as Record<string, unknown>;
    return (settingValue.value ?? APP_SETTING_DEFAULTS[settingKey]) as T;
  } catch (error) {
    logger.error('Failed to fetch app setting', {
      error: error instanceof Error ? error.message : 'Unknown',
      settingKey,
    });
    return APP_SETTING_DEFAULTS[settingKey] as T;
  }
}

/**
 * Fetches all app settings for the 'all' environment.
 */
export async function fetchAllAppSettings(): Promise<AppSetting[]> {
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

    return (data || []) as AppSetting[];
  } catch (error) {
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
export async function updateAppSetting(
  settingKey: AppSettingKey,
  value: unknown
): Promise<boolean> {
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
      .upsert(
        {
          setting_key: settingKey,
          setting_value: { value },
          environment_id: allEnvData.id,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'setting_key,environment_id',
        }
      );

    if (error) {
      logger.error('Error updating app setting', { error, settingKey });
      return false;
    }

    logger.info('App setting updated', { settingKey, value });
    return true;
  } catch (error) {
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
export async function getCheckoutTimerDuration(eventId?: string): Promise<number> {
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
    } catch (error) {
      logger.error('Error fetching queue configuration', {
        error: error instanceof Error ? error.message : 'Unknown',
        eventId,
      });
    }
  }

  // Fall back to global default
  const defaultMinutes = await fetchAppSetting<number>(
    APP_SETTING_KEYS.CHECKOUT_TIMER_DEFAULT_MINUTES
  );

  // Convert minutes to seconds
  return defaultMinutes * 60;
}
