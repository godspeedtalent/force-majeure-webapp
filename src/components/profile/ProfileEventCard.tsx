import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Music2, MapPin, Clock, History } from 'lucide-react';

import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { Badge } from '@/components/common/shadcn/badge';
import { UpcomingEvent } from './types';

interface ProfileEventCardProps {
  event: UpcomingEvent;
  isPast?: boolean;
}

/**
 * ProfileEventCard - Displays an event card in the user profile
 *
 * Responsive design:
 * - Mobile: Smaller image (w-16 h-16), compact text
 * - Desktop: Larger image (w-20 h-20), full text
 */
export const ProfileEventCard = ({ event, isPast = false }: ProfileEventCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  const eventDate = new Date(event.date);

  // Mobile format: shorter
  const formattedDateMobile = eventDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Desktop format: includes year
  const formattedDateDesktop = eventDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = eventDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <FmCommonCard
      className={`border-border/30 backdrop-blur-sm hover:bg-card/20 transition-colors cursor-pointer ${isPast ? 'opacity-70' : ''}`}
      onClick={() => navigate(`/event/${event.id}`)}
    >
      <FmCommonCardContent className='p-3 lg:p-4'>
        <div className='flex gap-3 lg:gap-4'>
          {/* Event Image - responsive sizing */}
          <div className='w-16 h-16 lg:w-20 lg:h-20 rounded-none overflow-hidden bg-muted flex-shrink-0'>
            {event.cover_image_url ? (
              <img
                src={event.cover_image_url}
                alt={event.title}
                className={`w-full h-full object-cover ${isPast ? 'grayscale' : ''}`}
              />
            ) : (
              <div className='w-full h-full bg-gradient-gold flex items-center justify-center'>
                <Music2 className='h-6 w-6 lg:h-8 lg:w-8 text-black' />
              </div>
            )}
          </div>

          {/* Event Info */}
          <div className='flex-1 min-w-0'>
            <h3 className='font-canela font-medium text-foreground text-sm lg:text-base truncate lg:mb-1'>
              {event.title}
            </h3>
            <div className='space-y-0.5 lg:space-y-1 mt-1 lg:mt-0'>
              <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <Clock className='h-3 w-3' />
                {/* Mobile: shorter format */}
                <span className='lg:hidden'>
                  {formattedDateMobile} · {formattedTime}
                </span>
                {/* Desktop: full format */}
                <span className='hidden lg:inline'>
                  {formattedDateDesktop} at {formattedTime}
                </span>
              </div>
              <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <MapPin className='h-3 w-3' />
                <span className='truncate'>{event.location}</span>
              </div>
            </div>
            <div className='flex items-center gap-2 mt-1 lg:mt-2'>
              <Badge variant='outline' className='text-[10px] lg:text-xs px-1.5 py-0'>
                {t('profile.ticketCount', { count: event.ticket_count })}
              </Badge>
              {isPast && (
                <Badge variant='outline' className='text-[10px] lg:text-xs px-1.5 py-0 text-muted-foreground'>
                  <History className='h-2.5 w-2.5 lg:h-3 lg:w-3 mr-0.5 lg:mr-1' />
                  {t('profile.past')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </FmCommonCardContent>
    </FmCommonCard>
  );
};
