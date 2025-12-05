export {
  default as i18n,
  SUPPORTED_LOCALES,
  LOCALE_LABELS,
  DEFAULT_LOCALE,
  isSupportedLocale,
  getBestMatchingLocale,
  type SupportedLocale,
} from './config';

export { useTranslation, Trans } from 'react-i18next';
