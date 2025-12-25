/**
 * PreferencesSection Component
 *
 * Handles user preferences like language selection.
 */

import { useTranslation } from 'react-i18next';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { LanguageSelector } from '@/components/common/i18n/LanguageSelector';
import { useLocaleSync } from '@/hooks/useLocaleSync';
import { useToast } from '@/shared/hooks/use-toast';
import type { SupportedLocale } from '@/i18n';

export function PreferencesSection() {
  const { t } = useTranslation('pages');
  const { t: tToast } = useTranslation('toasts');
  const { toast } = useToast();
  const { currentLocale, changeLocale } = useLocaleSync();

  return (
    <FmCommonCard>
      <FmCommonCardContent className='p-8 space-y-6'>
        <div>
          <h2 className='text-xl font-canela font-medium text-foreground mb-2'>
            {t('profile.preferences')}
          </h2>
          <p className='text-sm text-muted-foreground'>
            {t('profile.languageDescription')}
          </p>
        </div>

        <div className='max-w-xs'>
          <LanguageSelector
            value={currentLocale}
            onChange={(locale: SupportedLocale) => {
              changeLocale(locale);
              toast({
                title: tToast('settings.languageChanged'),
                description: tToast('settings.languageChangedDescription'),
              });
            }}
          />
        </div>
      </FmCommonCardContent>
    </FmCommonCard>
  );
}
