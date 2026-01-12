import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FmCommonCard } from '@/components/common/display/FmCommonCard';

interface Attendee {
  name: string;
  avatar: string;
}

interface EventGuestListProps {
  attendeePreview: Attendee[];
  ticketCount: number;
  isLoggedIn: boolean;
  onCardClick?: () => void;
  onPromptLogin: () => void;
}

/**
 * EventGuestList - Displays the guest list card with attendee previews
 *
 * Extracted from EventDetailsContent.tsx for better component organization.
 */
export const EventGuestList = ({
  attendeePreview,
  ticketCount,
  isLoggedIn,
  onCardClick,
  onPromptLogin,
}: EventGuestListProps) => {
  const { t } = useTranslation('common');

  return (
    <FmCommonCard
      variant='subtle'
      onClick={isLoggedIn ? onCardClick : undefined}
      className='relative overflow-hidden'
    >
      <h3 className='text-lg mb-4 font-canela'>{t('guestList.guestListTitle')}</h3>

      <div className='flex items-center gap-3 mb-4 min-w-0 overflow-hidden'>
        <div className='flex -space-x-2'>
          {attendeePreview.map((attendee, index) => (
            <div
              key={`${attendee.avatar}-${index}`}
              className='w-8 h-8 rounded-full bg-gradient-to-br from-fm-gold/20 to-fm-gold/40 border-2 border-card flex items-center justify-center transition-all duration-200 hover:scale-110 hover:border-fm-gold cursor-pointer'
              title={attendee.name}
            >
              <span className='text-[10px] font-semibold text-fm-gold'>
                {attendee.avatar}
              </span>
            </div>
          ))}
        </div>
        <div className='flex items-center gap-2'>
          <Users className='w-4 h-4 text-fm-gold' />
          <span className='text-xs font-normal text-muted-foreground'>
            {t('guestList.othersCount', { count: ticketCount })}
          </span>
        </div>
      </div>

      <div className='mt-4 border-t border-border pt-3'>
        <div className='flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground'>
          {isLoggedIn ? (
            <span className='font-normal text-muted-foreground'>
              {t('guestList.clickToSeeFullList')}
            </span>
          ) : (
            <button
              type='button'
              onClick={event => {
                event.stopPropagation();
                onPromptLogin();
              }}
              className='text-xs font-semibold text-fm-gold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-fm-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
            >
              {t('guestList.logInToSeeFullList')}
            </button>
          )}
        </div>
      </div>
    </FmCommonCard>
  );
};
