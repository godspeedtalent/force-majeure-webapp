import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/features/auth/services/AuthContext';
import { supabase } from '@force-majeure/shared';
import { logger } from '@force-majeure/shared';
import {
  type SupportedLocale,
  isSupportedLocale,
  getBestMatchingLocale,
  DEFAULT_LOCALE,
} from '@/i18n';

/**
 * Hook to synchronize locale between i18n, user profile, and localStorage.
 *
 * Priority:
 * 1. User's saved preference (from profiles.preferred_locale)
 * 2. Browser's language setting
 * 3. Fallback to English
 *
 * On mount:
 * - If user is logged in and has a preferred_locale, use it
 * - Otherwise, use browser detection (handled by i18next-browser-languagedetector)
 *
 * On locale change:
 * - Update i18n
 * - Save to localStorage (automatic via i18next)
 * - If user is logged in, save to database
 */
export function useLocaleSync() {
  const { i18n } = useTranslation();
  const { user, profile } = useAuth();

  /**
   * Get the current locale from i18n
   */
  const currentLocale = getBestMatchingLocale(i18n.language);

  /**
   * Change the locale
   * - Updates i18n (which saves to localStorage)
   * - If user is logged in, saves to database
   */
  const changeLocale = useCallback(
    async (locale: SupportedLocale) => {
      // Update i18n (this also updates localStorage via the detector)
      await i18n.changeLanguage(locale);

      // If user is logged in, save to database
      if (user?.id) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ preferred_locale: locale })
            .eq('user_id', user.id);

          if (error) {
            logger.error('Failed to save locale preference', {
              error: error.message,
              source: 'useLocaleSync',
              details: { userId: user.id, locale },
            });
          }
        } catch (err) {
          logger.error('Error saving locale preference', {
            error: err instanceof Error ? err.message : 'Unknown error',
            source: 'useLocaleSync',
          });
        }
      }
    },
    [i18n, user?.id]
  );

  /**
   * Sync locale from user profile on mount/profile change
   */
  useEffect(() => {
    if (profile?.preferred_locale && isSupportedLocale(profile.preferred_locale)) {
      // User has a saved preference, use it
      if (i18n.language !== profile.preferred_locale) {
        i18n.changeLanguage(profile.preferred_locale);
      }
    }
    // If no profile preference, i18next-browser-languagedetector handles browser detection
  }, [profile?.preferred_locale, i18n]);

  return {
    /**
     * Current locale (normalized to supported locale)
     */
    currentLocale,

    /**
     * Change the locale (updates i18n, localStorage, and database if logged in)
     */
    changeLocale,

    /**
     * Whether the locale is syncing with the server
     * (Currently not tracked, could be added if needed)
     */
    isSyncing: false,
  };
}

/**
 * Get the browser's preferred locale, normalized to supported locales
 */
export function getBrowserLocale(): SupportedLocale {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LOCALE;
  }

  // Try navigator.language first, then navigator.languages array
  const browserLang = navigator.language || navigator.languages?.[0];

  if (browserLang) {
    return getBestMatchingLocale(browserLang);
  }

  return DEFAULT_LOCALE;
}

export default useLocaleSync;
