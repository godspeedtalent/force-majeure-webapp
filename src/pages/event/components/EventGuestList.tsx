import { Users, ChevronRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/shared';

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
 * Redesigned with a fresh, modern look featuring:
 * - Animated gradient border on hover
 * - Stacked avatar display with hover effects
 * - Clear CTA for viewing full list
 */
export const EventGuestList = ({
  attendeePreview,
  ticketCount,
  isLoggedIn,
  onCardClick,
  onPromptLogin,
}: EventGuestListProps) => {
  const { t } = useTranslation('common');

  const hasAttendees = attendeePreview.length > 0 || ticketCount > 0;

  return (
    <div
      onClick={isLoggedIn ? onCardClick : undefined}
      className={cn(
        'group relative overflow-hidden',
        'bg-black/60 backdrop-blur-sm border border-white/10',
        'p-[20px]',
        'transition-all duration-300',
        isLoggedIn && 'cursor-pointer hover:border-fm-gold/30 hover:bg-black/70',
        'hover:shadow-[0_0_30px_rgba(223,186,125,0.08)]'
      )}
    >
      {/* Subtle corner accent */}
      <div className='absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 right-0 w-[1px] h-8 bg-gradient-to-b from-fm-gold/40 to-transparent' />
        <div className='absolute top-0 right-0 h-[1px] w-8 bg-gradient-to-l from-fm-gold/40 to-transparent' />
      </div>

      {/* Header */}
      <div className='flex items-center justify-between mb-[20px]'>
        <div className='flex items-center gap-[10px]'>
          <div className='p-2 bg-fm-gold/10 border border-fm-gold/20'>
            <Users className='w-4 h-4 text-fm-gold' />
          </div>
          <div>
            <h3 className='text-sm font-canela uppercase tracking-wider text-white/90'>
              {t('guestList.guestListTitle')}
            </h3>
            {hasAttendees && (
              <p className='text-xs text-muted-foreground mt-0.5'>
                {t('guestList.goingCount', { count: ticketCount })}
              </p>
            )}
          </div>
        </div>
        {isLoggedIn && (
          <ChevronRight className='w-4 h-4 text-muted-foreground group-hover:text-fm-gold group-hover:translate-x-1 transition-all duration-300' />
        )}
      </div>

      {/* Attendee Avatars */}
      {hasAttendees ? (
        <div className='flex items-center gap-[10px]'>
          <div className='flex -space-x-3'>
            {attendeePreview.slice(0, 5).map((attendee, index) => (
              <div
                key={`${attendee.avatar}-${index}`}
                className={cn(
                  'relative w-10 h-10 flex items-center justify-center',
                  'bg-gradient-to-br from-fm-gold/15 to-fm-gold/30',
                  'border-2 border-background/80',
                  'transition-all duration-300',
                  'group-hover:border-fm-gold/40',
                  'hover:!scale-110 hover:!z-10 hover:!border-fm-gold'
                )}
                style={{ zIndex: attendeePreview.length - index }}
                title={attendee.name}
              >
                <span className='text-xs font-semibold text-fm-gold/90'>
                  {attendee.avatar}
                </span>
              </div>
            ))}
          </div>
          {ticketCount > attendeePreview.length && (
            <span className='text-xs text-muted-foreground/80 font-light'>
              {t('guestList.andMore', { count: ticketCount - attendeePreview.length })}
            </span>
          )}
        </div>
      ) : (
        <div className='flex items-center gap-[10px] py-2'>
          <Sparkles className='w-4 h-4 text-fm-gold/50' />
          <span className='text-sm text-muted-foreground/70 font-light'>
            {t('guestList.beFirstToRsvp')}
          </span>
        </div>
      )}

      {/* Footer CTA */}
      <div className='mt-[20px] pt-[10px] border-t border-white/5'>
        {isLoggedIn ? (
          <span className='text-xs text-muted-foreground/60 group-hover:text-fm-gold/70 transition-colors duration-300'>
            {t('guestList.clickToSeeFullList')}
          </span>
        ) : (
          <button
            type='button'
            onClick={event => {
              event.stopPropagation();
              onPromptLogin();
            }}
            className={cn(
              'text-xs font-medium text-fm-gold/80',
              'hover:text-fm-gold',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-fm-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'transition-colors duration-200'
            )}
          >
            {t('guestList.logInToSeeFullList')}
          </button>
        )}
      </div>
    </div>
  );
};
