import { jsx as _jsx } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { SUPPORTED_LOCALES, LOCALE_LABELS, } from '@/i18n';
/**
 * Language options with native language names
 */
const LANGUAGE_OPTIONS = SUPPORTED_LOCALES.map(locale => ({
    value: locale,
    label: LOCALE_LABELS[locale],
    icon: Globe,
}));
/**
 * Language selector component for user preferences.
 * Displays a dropdown with supported languages (English, Spanish, Mandarin).
 */
export function LanguageSelector({ value, onChange, disabled = false, description, className, }) {
    const { t } = useTranslation('common');
    const handleChange = (newValue) => {
        // Validate that the value is a supported locale
        if (SUPPORTED_LOCALES.includes(newValue)) {
            onChange(newValue);
        }
    };
    return (_jsx(FmCommonSelect, { label: t('settings.language'), value: value, onChange: handleChange, options: LANGUAGE_OPTIONS, placeholder: t('settings.language'), description: description, disabled: disabled, containerClassName: className }));
}
export default LanguageSelector;
