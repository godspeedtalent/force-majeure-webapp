import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

import { FmCommonSelect, SelectOption } from '@/components/common/forms/FmCommonSelect';
import {
  SUPPORTED_LOCALES,
  LOCALE_LABELS,
  type SupportedLocale,
} from '@/i18n';

/**
 * Language options with native language names
 */
const LANGUAGE_OPTIONS: SelectOption[] = SUPPORTED_LOCALES.map(locale => ({
  value: locale,
  label: LOCALE_LABELS[locale],
  icon: Globe,
}));

interface LanguageSelectorProps {
  /**
   * Current selected locale
   */
  value: SupportedLocale;
  /**
   * Callback when locale changes
   */
  onChange: (locale: SupportedLocale) => void;
  /**
   * Whether the selector is disabled
   */
  disabled?: boolean;
  /**
   * Optional description text
   */
  description?: string;
  /**
   * Optional container class name
   */
  className?: string;
}

/**
 * Language selector component for user preferences.
 * Displays a dropdown with supported languages (English, Spanish, Mandarin).
 */
export function LanguageSelector({
  value,
  onChange,
  disabled = false,
  description,
  className,
}: LanguageSelectorProps) {
  const { t } = useTranslation('common');

  const handleChange = (newValue: string) => {
    // Validate that the value is a supported locale
    if (SUPPORTED_LOCALES.includes(newValue as SupportedLocale)) {
      onChange(newValue as SupportedLocale);
    }
  };

  return (
    <FmCommonSelect
      label={t('settings.language')}
      value={value}
      onChange={handleChange}
      options={LANGUAGE_OPTIONS}
      placeholder={t('settings.language')}
      description={description}
      disabled={disabled}
      containerClassName={className}
    />
  );
}

export default LanguageSelector;
