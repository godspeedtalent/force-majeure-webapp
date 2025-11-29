import {
  MapPin,
  ExternalLink,
  Settings,
  X,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ExternalLinkDialog } from '@/components/business/ExternalLinkDialog';
import { FmDateBox } from '@/components/common/display/FmDateBox';
import { FmUndercardList } from '@/components/common/display/FmUndercardList';
import { Button } from '@/components/common/shadcn/button';
import {
  FmCommonContextMenu,
  ContextMenuAction,
} from '@/components/common/modals/FmCommonContextMenu';
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { cn } from '@/shared/utils/utils';
import { parseTimeToMinutes } from '@/shared/utils/timeUtils';

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
}

interface EventCardProps {
  event: Event;
  isSingleRow?: boolean;
  isPastEvent?: boolean;
}

export const EventCard = ({ event, isSingleRow = false, isPastEvent = false }: EventCardProps) => {
  const navigate = useNavigate();
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      weekday: date
        .toLocaleDateString('en-US', { weekday: 'short' })
        .toUpperCase(),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString(),
      year: date.getFullYear().toString(),
    };
  };

  const isAfterHours = (() => {
    const minutes = parseTimeToMinutes(event.time);
    return minutes !== null && minutes > 120; // strictly past 2:00 AM
  })();

  const handleTicketsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTicketDialog(true);
  };

  const dateObj = formatDate(event.date);

  // Determine the display title - use event title if available, otherwise headliner name
  const displayTitle = event.title || event.headliner.name;

  // Context menu actions for admin/developer
  const contextMenuActions: ContextMenuAction<Event>[] = [
    {
      label: 'Manage Event',
      icon: <Settings className='w-4 h-4' />,
      onClick: eventData => {
        navigate(`/events/edit/${eventData.id}`);
      },
    },
    {
      label: 'Cancel',
      icon: <X className='w-4 h-4' />,
      onClick: () => {
        // Just closes the menu, no action needed
      },
    },
  ];

  const handleCardClick = () => {
    if ('startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        navigate(`/event/${event.id}`);
      });
    } else {
      navigate(`/event/${event.id}`);
    }
  };

  return (
    <>
      <FmCommonContextMenu
        actions={contextMenuActions}
        data={event}
        onOpenChange={setContextMenuOpen}
      >
        <div
          className={cn(
            'group relative overflow-hidden rounded-none border border-border bg-card',
            'transition-all duration-300 cursor-pointer',
            // Single row: viewport-based height with 2:3 aspect ratio (72vh for 20% increase from 60vh)
            isSingleRow ? 'h-[72vh] w-auto' : 'aspect-[2/3] w-full max-w-[500px]',
            // Apply hover state when actually hovering OR when context menu is open
            contextMenuOpen && 'border-fm-gold/50 shadow-lg shadow-fm-gold/10',
            'hover:border-fm-gold/50 hover:shadow-lg hover:shadow-fm-gold/10'
          )}
          style={isSingleRow ? { aspectRatio: '2/3' } : undefined}
          onClick={handleCardClick}
        >
          {/* Hero Image Section - Takes up more space for 2:3 ratio */}
          <div
            className='relative flex-1 min-h-0 bg-muted'
            style={{ viewTransitionName: `magazine-hero-${event.id}` }}
          >
            <ImageWithSkeleton
              src={event.heroImage}
              alt={displayTitle}
              className={cn(
                'h-full w-full object-contain transition-all duration-500',
                'group-hover:scale-105',
                // Keep scaled when context menu is open
                contextMenuOpen && 'scale-105'
              )}
              skeletonClassName='rounded-none' // Sharp corners per design system
            />

            {/* Gradient Overlay */}
            <div className='absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent' />
          </div>

          {/* Content Section - Card Body */}
          <div className='relative flex-1 flex flex-col'>
            <div className='flex flex-1'>
              {/* Main Content - Left Side */}
              <div className='flex-1 p-6 flex flex-col min-w-0'>
                {/* Event Title and Venue */}
                <div className='mb-4'>
                  <h3 className='font-canela text-2xl font-medium text-foreground line-clamp-2 mb-0.5'>
                    {displayTitle}
                  </h3>
                  {(event.display_subtitle ?? true) && (
                    <p className='text-sm text-muted-foreground/90 truncate'>
                      {event.venue}
                    </p>
                  )}
                </div>

                {/* Undercard Artists */}
                <FmUndercardList
                  artists={event.undercard}
                  size='sm'
                  className='mb-4'
                />

                {/* Event Details */}
                <div className='space-y-2 mb-4'>
                  {/* Lineup - only show if there are undercard artists */}
                  {event.undercard.length > 0 && (
                    <div className='flex items-start gap-2 text-sm text-muted-foreground'>
                      <Users className='w-4 h-4 text-fm-gold flex-shrink-0 mt-0.5' />
                      <div className='flex flex-col'>
                        {event.undercard.map((artist, index) => (
                          <span key={index} className='truncate'>
                            {artist.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <MapPin className='w-4 h-4 text-fm-gold flex-shrink-0' />
                    <span className='truncate'>{event.venue}</span>
                  </div>
                </div>

                {/* Action Buttons - Push to bottom */}
                {!isPastEvent && event.ticketUrl && (
                  <div className='flex gap-2 mt-auto'>
                    <Button
                      size='sm'
                      onClick={handleTicketsClick}
                      className='flex-1 bg-fm-gold hover:bg-fm-gold/90 text-background font-medium transition-all duration-200'
                    >
                      <ExternalLink className='w-4 h-4 mr-2' />
                      Get Tickets
                    </Button>
                  </div>
                )}
              </div>

              {/* Date Column - Right Side */}
              <FmDateBox
                weekday={dateObj.weekday}
                month={dateObj.month}
                day={dateObj.day}
                year={parseInt(dateObj.year, 10)}
                size='md'
                className='border-l rounded-none'
              />
            </div>

            {/* Card Footer - After Hours Badge */}
            {isAfterHours && (
              <div className='w-full border-t border-border bg-transparent py-0.5 text-center transition-all duration-200 group-hover:bg-fm-gold group-hover:text-background mb-0'>
                <span className='text-[8px] font-bold tracking-wider uppercase leading-none text-fm-gold group-hover:text-background'>
                  After Hours
                </span>
              </div>
            )}
          </div>
        </div>
      </FmCommonContextMenu>

      {event.ticketUrl && (
        <ExternalLinkDialog
          open={showTicketDialog}
          onOpenChange={setShowTicketDialog}
          url={event.ticketUrl}
          title='Leaving Force Majeure'
          description="You're about to be redirected to an external site to purchase tickets. Continue?"
          onStopPropagation={true}
        />
      )}
    </>
  );
};
