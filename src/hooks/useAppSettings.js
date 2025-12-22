import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAppSetting, fetchAllAppSettings, updateAppSetting, getCheckoutTimerDuration, APP_SETTING_KEYS, } from '@/services/appSettingsService';
/**
 * Query key factory for app settings
 */
export const appSettingsKeys = {
    all: ['appSettings'],
    setting: (key) => ['appSettings', key],
    checkoutTimer: (eventId) => ['checkoutTimer', eventId],
};
/**
 * Hook to fetch all app settings
 */
export function useAppSettings() {
    return useQuery({
        queryKey: appSettingsKeys.all,
        queryFn: fetchAllAppSettings,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
/**
 * Hook to fetch a specific app setting
 */
export function useAppSetting(settingKey) {
    return useQuery({
        queryKey: appSettingsKeys.setting(settingKey),
        queryFn: () => fetchAppSetting(settingKey),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
/**
 * Hook to get checkout timer default (in minutes)
 */
export function useCheckoutTimerDefault() {
    return useAppSetting(APP_SETTING_KEYS.CHECKOUT_TIMER_DEFAULT_MINUTES);
}
/**
 * Hook to get checkout timer duration in seconds (with per-event override support)
 */
export function useCheckoutTimerDuration(eventId) {
    return useQuery({
        queryKey: appSettingsKeys.checkoutTimer(eventId),
        queryFn: () => getCheckoutTimerDuration(eventId),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
/**
 * Hook to update an app setting
 */
export function useUpdateAppSetting() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ key, value }) => updateAppSetting(key, value),
        onSuccess: (_data, variables) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: appSettingsKeys.all });
            queryClient.invalidateQueries({
                queryKey: appSettingsKeys.setting(variables.key),
            });
            // Also invalidate checkout timer queries if that setting changed
            if (variables.key === APP_SETTING_KEYS.CHECKOUT_TIMER_DEFAULT_MINUTES) {
                queryClient.invalidateQueries({ queryKey: ['checkoutTimer'] });
            }
        },
    });
}
