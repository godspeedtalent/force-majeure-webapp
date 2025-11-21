import {
  MapPin,
  Clock,
  ExternalLink,
  Calendar,
  Settings,
  X,
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
import {
  formatTimeDisplay,
  parseTimeToMinutes,
} from '@/shared/utils/timeUtils';

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
}

interface EventCardProps {
  event: Event;
  isSingleRow?: boolean;
}

export const EventCard = ({ event, isSingleRow = false }: EventCardProps) => {
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

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
            // Single row: viewport-based height with 2:3 aspect ratio (50vh to fit within 60vh container)
            isSingleRow ? 'h-[50vh] w-auto' : 'aspect-[2/3]',
            // Apply hover state when actually hovering OR when context menu is open
            contextMenuOpen && 'border-fm-gold/50 shadow-lg shadow-fm-gold/10',
            'hover:border-fm-gold/50 hover:shadow-lg hover:shadow-fm-gold/10'
          )}
          style={isSingleRow ? { aspectRatio: '2/3' } : undefined}
          onClick={handleCardClick}
        >
          {/* Hero Image Section - Takes up more space for 2:3 ratio */}
          <div
            className='relative h-[65%] overflow-hidden bg-muted'
            style={{ viewTransitionName: `magazine-hero-${event.id}` }}
          >
            <ImageWithSkeleton
              src={event.heroImage}
              alt={displayTitle}
              className={cn(
                'h-full w-full object-cover transition-all duration-500',
                'group-hover:scale-105',
                // Keep scaled when context menu is open
                contextMenuOpen && 'scale-105'
              )}
              skeletonClassName='rounded-none' // Sharp corners per design system
            />

            {/* Gradient Overlay */}
            <div className='absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent' />

            {/* Event Title Overlay - at bottom of hero image */}
            <div className='absolute bottom-0 left-0 right-0 p-4'>
              <h3 className='font-canela text-2xl font-medium text-foreground line-clamp-2'>
                {displayTitle}
              </h3>
            </div>
          </div>

          {/* Content Section */}
          <div className='relative h-[35%] flex'>
            {/* Main Content - Left Side */}
            <div className='flex-1 p-6 pt-4 flex flex-col min-w-0'>
              {/* Undercard Artists */}
              <FmUndercardList
                artists={event.undercard}
                size='sm'
                className='mb-4'
              />

              {/* Event Details */}
              <div className='space-y-2 mb-4'>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Calendar className='w-4 h-4 text-fm-gold flex-shrink-0' />
                  <span className='truncate'>{formatFullDate(event.date)}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Clock className='w-4 h-4 text-fm-gold flex-shrink-0' />
                  <span>{formatTimeDisplay(event.time)}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <MapPin className='w-4 h-4 text-fm-gold flex-shrink-0' />
                  <span className='truncate'>{event.venue}</span>
                </div>
              </div>

              {/* Action Buttons - Push to bottom */}
              {event.ticketUrl && (
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
              isAfterHours={isAfterHours}
              className='border-l rounded-none'
            />
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
