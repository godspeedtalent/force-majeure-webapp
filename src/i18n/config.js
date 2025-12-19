import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
export const SUPPORTED_LOCALES = ['en', 'es', 'zh'];
export const LOCALE_LABELS = {
    en: 'English',
    es: 'Español',
    zh: '中文',
};
export const DEFAULT_LOCALE = 'en';
/**
 * Check if a locale is supported
 */
export function isSupportedLocale(locale) {
    return SUPPORTED_LOCALES.includes(locale);
}
/**
 * Get the best matching supported locale from a locale string
 * Handles cases like 'en-US' -> 'en', 'zh-CN' -> 'zh'
 */
export function getBestMatchingLocale(locale) {
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
i18n
    .use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
    ns: ['common', 'pages', 'validation', 'toasts'],
    defaultNS: 'common',
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
        useSuspense: true,
    },
});
export default i18n;
