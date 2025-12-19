import i18nInstance from './config';

export {
  SUPPORTED_LOCALES,
  LOCALE_LABELS,
  DEFAULT_LOCALE,
  isSupportedLocale,
  getBestMatchingLocale,
  type SupportedLocale,
} from './config';

export { useTranslation, Trans } from 'react-i18next';

// Re-export i18n instance as both named and default export
export const i18n = i18nInstance;
export default i18nInstance;
