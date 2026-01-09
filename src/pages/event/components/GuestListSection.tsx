import { Eye, Users } from 'lucide-react';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { useTranslation } from 'react-i18next';

interface GuestListSectionProps {
  attendeePreview: Array<{ name: string; avatar: string }>;
  ticketCount: number;
  viewCount: number;
  isLoggedIn: boolean;
  onClick?: () => void;
  onLoginPrompt: () => void;
}

export function GuestListSection({
  attendeePreview,
  ticketCount,
  viewCount,
  isLoggedIn,
  onClick,
  onLoginPrompt,
}: GuestListSectionProps) {
  const { t } = useTranslation('common');

  return (
    <FmCommonCard
      variant='default'
      onClick={isLoggedIn ? onClick : undefined}
      className='relative overflow-hidden'
    >
      <h3 className='text-lg mb-4 font-canela'>{t('guestList.guestListTitle')}</h3>

      <div className='flex items-center gap-3 mb-4'>
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
                onLoginPrompt();
              }}
              className='text-xs font-semibold text-fm-gold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-fm-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
            >
              {t('guestList.logInToSeeFullList')}
            </button>
          )}
          <div className='flex items-center gap-2'>
            <Eye className='w-4 h-4' />
            <span>{t('guestList.pageViews', { count: viewCount })}</span>
          </div>
        </div>
      </div>
    </FmCommonCard>
  );
}
