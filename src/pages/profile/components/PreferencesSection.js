import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * PreferencesSection Component
 *
 * Handles user preferences like language selection.
 */
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/common/shadcn/card';
import { LanguageSelector } from '@/components/common/i18n/LanguageSelector';
import { useLocaleSync } from '@/hooks/useLocaleSync';
import { useToast } from '@/shared/hooks/use-toast';
export function PreferencesSection() {
    const { t } = useTranslation('pages');
    const { t: tToast } = useTranslation('toasts');
    const { toast } = useToast();
    const { currentLocale, changeLocale } = useLocaleSync();
    return (_jsx(Card, { className: 'border-border/30 bg-card/20 backdrop-blur-lg', children: _jsxs(CardContent, { className: 'p-8 space-y-6', children: [_jsxs("div", { children: [_jsx("h2", { className: 'text-xl font-canela font-medium text-foreground mb-2', children: t('profile.preferences') }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('profile.languageDescription') })] }), _jsx("div", { className: 'max-w-xs', children: _jsx(LanguageSelector, { value: currentLocale, onChange: (locale) => {
                            changeLocale(locale);
                            toast({
                                title: tToast('settings.languageChanged'),
                                description: tToast('settings.languageChangedDescription'),
                            });
                        } }) })] }) }));
}
