import { ChevronRight, Sparkles, Users } from 'lucide-react';
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
 * EventGuestList - Displays the guest list card with prominent KPI display
 *
 * Features:
 * - Large, prominent attendee count as focal point
 * - Stacked avatar display showing who's going
 * - Encouraging messaging to drive engagement
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
        'bg-black/60 backdrop-blur-sm',
        'p-[20px]',
        'transition-all duration-300',
        isLoggedIn && 'cursor-pointer hover:bg-black/70',
        'hover:shadow-[0_0_30px_rgba(223,186,125,0.08)]'
      )}
    >
      {/* Animated shimmer border */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          background: 'linear-gradient(90deg, transparent 0%, transparent 25%, rgba(223,186,125,0.5) 50%, transparent 75%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'border-shimmer-gold 3s linear infinite',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />
      {/* Static border fallback */}
      <div className='absolute inset-0 border border-white/10 pointer-events-none' />

      {/* Subtle corner accent */}
      <div className='absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 right-0 w-[1px] h-8 bg-gradient-to-b from-fm-gold/40 to-transparent' />
        <div className='absolute top-0 right-0 h-[1px] w-8 bg-gradient-to-l from-fm-gold/40 to-transparent' />
      </div>

      {hasAttendees ? (
        <div className='flex items-center gap-[20px]'>
          {/* KPI Display - Large Count */}
          <div className='flex-shrink-0 flex flex-col items-center justify-center min-w-[80px]'>
            <div className='flex items-baseline gap-1'>
              <span className='text-4xl lg:text-5xl font-canela font-medium text-fm-gold tabular-nums'>
                {ticketCount}
              </span>
              {ticketCount >= 10 && (
                <Users className='w-4 h-4 text-fm-gold/60' />
              )}
            </div>
            <span className='text-xs uppercase tracking-wider text-muted-foreground mt-1'>
              {t('guestList.goingLabel')}
            </span>
          </div>

          {/* Divider */}
          <div className='w-[1px] h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent flex-shrink-0' />

          {/* Avatars and CTA */}
          <div className='flex-1 min-w-0'>
            {/* Stacked Avatars */}
            <div className='flex items-center gap-[10px] mb-[10px]'>
              <div className='flex -space-x-3'>
                {attendeePreview.slice(0, 5).map((attendee, index) => (
                  <div
                    key={`${attendee.avatar}-${index}`}
                    className={cn(
                      'relative w-9 h-9 flex items-center justify-center',
                      'bg-gradient-to-br from-fm-gold/15 to-fm-gold/30',
                      'border-2 border-background/80',
                      'transition-all duration-300',
                      'group-hover:border-fm-gold/40'
                    )}
                    style={{ zIndex: attendeePreview.length - index }}
                    title={attendee.name}
                  >
                    <span className='text-[10px] font-semibold text-fm-gold/90'>
                      {attendee.avatar}
                    </span>
                  </div>
                ))}
              </div>
              {ticketCount > 5 && (
                <span className='text-xs text-fm-gold/70 font-medium'>
                  +{ticketCount - 5}
                </span>
              )}
            </div>

            {/* Encouraging message */}
            <p className='text-xs text-muted-foreground/70 leading-relaxed'>
              {t('guestList.joinTheCrowd')}
            </p>

            {/* CTA */}
            <div className='mt-[10px] flex items-center gap-2'>
              {isLoggedIn ? (
                <span className='text-xs text-muted-foreground/50 group-hover:text-fm-gold/70 transition-colors duration-300 flex items-center gap-1'>
                  {t('guestList.seeWhosComing')}
                  <ChevronRight className='w-3 h-3 group-hover:translate-x-0.5 transition-transform' />
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
        </div>
      ) : (
        /* Empty state */
        <div className='flex items-center gap-[20px]'>
          <div className='flex-shrink-0 flex flex-col items-center justify-center min-w-[80px]'>
            <Sparkles className='w-8 h-8 text-fm-gold/30 mb-2' />
            <span className='text-xs uppercase tracking-wider text-muted-foreground/50'>
              {t('guestList.beFirst')}
            </span>
          </div>
          <div className='w-[1px] h-12 bg-gradient-to-b from-transparent via-white/10 to-transparent flex-shrink-0' />
          <div className='flex-1'>
            <p className='text-sm text-muted-foreground/70 font-light'>
              {t('guestList.beFirstToRsvp')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
