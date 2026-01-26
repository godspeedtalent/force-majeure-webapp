import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { diagStart, diagComplete, diagError, diagWarn } from '@/shared/services/initDiagnostics';

// Bundle English translations directly for instant loading (from src/locales)
// Other languages (es, zh) load via HTTP on-demand (from public/locales)
import commonEn from '@/locales/en/common.json';
import pagesEn from '@/locales/en/pages.json';
import validationEn from '@/locales/en/validation.json';
import toastsEn from '@/locales/en/toasts.json';

export const SUPPORTED_LOCALES = ['en', 'es', 'zh'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  es: 'Español',
  zh: '中文',
};

export const DEFAULT_LOCALE: SupportedLocale = 'en';

/**
 * Check if a locale is supported
 */
export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

/**
 * Get the best matching supported locale from a locale string
 * Handles cases like 'en-US' -> 'en', 'zh-CN' -> 'zh'
 */
export function getBestMatchingLocale(locale: string): SupportedLocale {
  // Direct match
  if (isSupportedLocale(locale)) {
    return locale;
  }

  // Try language code only (e.g., 'en-US' -> 'en')
  const languageCode = locale.split('-')[0];
  if (isSupportedLocale(languageCode)) {
    return languageCode;
  }

  return DEFAULT_LOCALE;
}

diagStart('i18n.init');

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
    ns: ['common', 'pages', 'validation', 'toasts'],
    defaultNS: 'common',

    // Bundle English translations - available instantly, no network request
    // Other languages (es, zh) load via HttpBackend on-demand
    resources: {
      en: {
        common: commonEn,
        pages: pagesEn,
        validation: validationEn,
        toasts: toastsEn,
      },
    },
    partialBundledLanguages: true, // Allow HTTP loading for non-bundled languages

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false, // React already handles XSS protection
    },
    react: {
      // Safe to use Suspense now because:
      // 1. English is bundled - loads instantly (no network)
      // 2. App.tsx has a loading gate with timeout for other languages
      useSuspense: true,
    },
  })
  .then(() => {
    diagComplete('i18n.init');
  })
  .catch((err) => {
    diagError('i18n.init', err);
  });

// Log when resources are loaded
i18n.on('loaded', (loaded) => {
  diagComplete('i18n.resources', { locales: Object.keys(loaded) });
});

i18n.on('failedLoading', (lng, ns, msg) => {
  diagWarn('i18n.load', `Failed to load ${lng}/${ns}: ${msg}`);
});

export default i18n;
