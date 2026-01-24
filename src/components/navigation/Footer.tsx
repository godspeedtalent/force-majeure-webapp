import { Instagram } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FmI18nCommon } from '@/components/common/i18n';
import { SOCIAL_LINKS } from '@/shared';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation('common');

  return (
    <footer className='w-full bg-background/50 backdrop-blur-md border-t border-border'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-10'>
          <div className='flex-1' />
          <FmI18nCommon
            i18nKey='footer.copyright'
            values={{ year: currentYear }}
            as='p'
            className='text-xs text-muted-foreground'
          />
          <div className='flex-1 flex justify-end'>
            <a
              href={SOCIAL_LINKS.instagram}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-1.5 text-muted-foreground hover:text-fm-gold transition-colors duration-200'
              aria-label={t('nav.followOnInstagram')}
            >
              <Instagram className='h-4 w-4' />
              <span className='hidden sm:inline text-xs'>{SOCIAL_LINKS.instagramHandle}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
