import { useTranslation } from 'react-i18next';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { MessagePanel } from '@/components/feedback/MessagePanel';
import { Button } from '@/components/common/shadcn/button';
import { ExternalLink } from 'lucide-react';

import { LF_SYSTEM_TICKET_URL } from '@force-majeure/shared';

export function InvalidTokenView() {
  const { t } = useTranslation('common');

  return (
    <>
      <MessagePanel
        title={t('scavenger.views.invalidCode')}
        description={t('scavenger.views.invalidCodeDescription')}
        className='mb-4'
        action={
          <>
            <DecorativeDivider />
            <p className='text-muted-foreground font-canela'>
              {t('scavenger.views.photoInstructions')}
            </p>
            <p className='text-foreground font-canela'>
              {t('scavenger.views.sendPhotoTo')}{' '}
              <a
                href='https://www.instagram.com/force.majeure.events/'
                target='_blank'
                rel='noopener noreferrer'
                className='text-fm-gold hover:underline'
              >
                @force.majeure.events
              </a>{' '}
              {t('scavenger.views.onInstagram')}
            </p>
            <DecorativeDivider />
            <p className='text-white font-canela'>
              {t('scavenger.views.jumpToTickets')}
            </p>
            <Button
              size='lg'
              className='w-full max-w-xs mx-auto bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
              onClick={() => window.open(LF_SYSTEM_TICKET_URL, '_blank')}
            >
              <ExternalLink className='mr-2 h-4 w-4' />
              {t('buttons.buyTickets')}
            </Button>
          </>
        }
      />
    </>
  );
}
