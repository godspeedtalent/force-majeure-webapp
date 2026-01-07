import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, ExternalLink } from 'lucide-react';
import { cn } from '@/shared';
import { ExternalLinkDialog } from '@/components/business/ExternalLinkDialog';
import { FmDateBox } from '@/components/common/display/FmDateBox';
import { FmUndercardList } from '@/components/common/display/FmUndercardList';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';

interface Artist {
  name: string;
  genre: string;
  image?: string | null;
}

interface Event {
  id: string;
  title: string;
  headliner: Artist;
  undercard: Artist[];
  date: string;
  time: string;
  venue: string;
  heroImage: string;
  description: string | null;
  ticketUrl?: string | null;
  display_subtitle?: boolean;
  is_after_hours?: boolean;
  is_tba?: boolean;
}

export interface MobileEventFullCardProps {
  event: Event;
  /** Whether this is a past event */
  isPastEvent?: boolean;
  /** Callback when tickets button is clicked */
  onTicketsClick?: () => void;
  /** Section index passed from container */
  sectionIndex?: number;
  /** Parallax Y offset for image in vh (0 to 5, slides down) */
  imageParallaxY?: number;
  /** Parallax X offset for image in vw (0 to 5, slides right) */
  imageParallaxX?: number;
  /** Parallax Y offset for content in vh (0 to -5, slides up) */
  contentParallaxY?: number;
}

/**
 * Full-screen mobile event card for the swipe experience
 * Fills the viewport with hero image and bottom-anchored content
 */
export function MobileEventFullCard({
  event,
  isPastEvent = false,
  onTicketsClick,
  imageParallaxY = 0,
  imageParallaxX = 0,
  contentParallaxY = 0,
}: MobileEventFullCardProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [showTicketDialog, setShowTicketDialog] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      weekday: date
        .toLocaleDateString('en-US', { weekday: 'short' })
        .toUpperCase(),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString(),
      year: date.getFullYear(),
    };
  };

  const dateObj = formatDate(event.date);
  const displayTitle = event.title || event.headliner.name;
  const isAfterHours = event.is_after_hours ?? false;

  const handleTicketsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTicketsClick) {
      onTicketsClick();
    } else {
      setShowTicketDialog(true);
    }
  };

  const handleCardClick = () => {
    if ('startViewTransition' in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        navigate(`/event/${event.id}`);
      });
    } else {
      navigate(`/event/${event.id}`);
    }
  };

  return (
    <>
      <div
        className={cn(
          'relative flex-1 w-full',
          'flex flex-col',
          'cursor-pointer',
          'overflow-hidden'
        )}
        onClick={handleCardClick}
      >
        {/* Hero Image - fills available space with parallax, top padding for nav bar */}
        {/* Oversized and offset to prevent blank space during parallax movement */}
        <div
          className='absolute transition-transform duration-100 ease-linear pt-[64px]'
          style={{
            // Start offset by -2vw/-2vh to account for max parallax movement
            // Size is 100% + 2vw/2vh to fill any gaps
            top: '-2vh',
            left: '-2vw',
            width: 'calc(100% + 4vw)',
            height: 'calc(100% + 4vh)',
            viewTransitionName: `magazine-hero-${event.id}`,
            transform: `translate(${imageParallaxX}vw, ${imageParallaxY}vh)`,
          }}
        >
          <ImageWithSkeleton
            src={event.heroImage}
            alt={displayTitle}
            className='h-full w-full object-cover'
            skeletonClassName='rounded-none'
          />

          {/* Gradient Overlay - stronger at bottom for text readability */}
          <div
            className={cn(
              'absolute inset-0',
              'bg-gradient-to-t from-black via-black/50 to-transparent'
            )}
          />
        </div>

        {/* Content - anchored to bottom with parallax */}
        <div
          className='relative z-10 mt-auto p-[20px] pb-[100px] transition-transform duration-100 ease-linear'
          style={{ transform: `translateY(${contentParallaxY}vh)` }}
        >
          <div className='flex items-end gap-[20px]'>
            {/* Event Info - Left Side */}
            <div className='flex-1 min-w-0'>
              {/* Event Title */}
              <h2
                className={cn(
                  'font-canela text-3xl font-medium text-foreground',
                  'line-clamp-2 mb-[10px]'
                )}
              >
                {displayTitle}
              </h2>

              {/* Undercard Artists */}
              {event.undercard.length > 0 && (
                <FmUndercardList
                  artists={event.undercard}
                  size='md'
                  className='mb-[10px]'
                />
              )}

              {/* Venue */}
              <div className='flex items-center gap-2 text-sm text-muted-foreground mb-[20px]'>
                <MapPin className='w-4 h-4 text-fm-gold flex-shrink-0' />
                <span className='truncate'>{event.venue}</span>
              </div>

              {/* After Hours Badge */}
              {isAfterHours && (
                <div className='inline-block mb-[20px]'>
                  <span
                    className={cn(
                      'text-[10px] font-bold tracking-wider uppercase',
                      'px-3 py-1.5',
                      'border border-fm-gold text-fm-gold',
                      'bg-black/40 backdrop-blur-sm'
                    )}
                  >
                    {t('eventCard.afterHoursEvent')}
                  </span>
                </div>
              )}

              {/* Tickets Button */}
              {!isPastEvent && event.ticketUrl && (
                <FmCommonButton
                  onClick={handleTicketsClick}
                  variant='gold'
                  icon={ExternalLink}
                  className='w-full'
                >
                  {t('eventCard.getTickets')}
                </FmCommonButton>
              )}
            </div>

            {/* Date Box - Right Side (no After Hours badge on mobile) */}
            <FmDateBox
              weekday={dateObj.weekday}
              month={dateObj.month}
              day={dateObj.day}
              year={dateObj.year}
              size='lg'
              isAfterHours={false}
              className='flex-shrink-0'
            />
          </div>
        </div>
      </div>

      {/* External Link Dialog */}
      {event.ticketUrl && (
        <ExternalLinkDialog
          open={showTicketDialog}
          onOpenChange={setShowTicketDialog}
          url={event.ticketUrl}
          title={t('dialogs.leavingSite')}
          description={t('eventCard.redirectDescription')}
          onStopPropagation={true}
        />
      )}
    </>
  );
}
