import { Clock, MapPin, ExternalLink } from 'lucide-react';
import { useState } from 'react';

import { ExternalLinkDialog } from '@/components/business/ExternalLinkDialog';
import { FmBadge } from '@/components/common/display/FmBadge';
import { FmDateBox } from '@/components/common/display/FmDateBox';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import {
  formatTimeDisplay,
  parseTimeToMinutes,
} from '@/shared/utils/timeUtils';

interface Artist {
  name: string;
  genre?: string;
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
  description?: string | null;
  ticketUrl?: string | null;
}

interface EventRowProps {
  event: Event;
}

export const EventRow = ({ event }: EventRowProps) => {
  const [showTicketDialog, setShowTicketDialog] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      weekday: date
        .toLocaleDateString('en-US', { weekday: 'short' })
        .toUpperCase(),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString(),
      fullDate: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    };
  };

  const isAfterHours = (() => {
    const minutes = parseTimeToMinutes(event.time);
    return minutes !== null && minutes >= 120; // 2:00 AM = 120 minutes
  })();

  const handleTicketsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTicketDialog(true);
  };

  const dateObj = formatDate(event.date);

  return (
    <>
      <div className='group event-hover-invert flex items-stretch bg-card border-b border-border transition-all duration-300 cursor-pointer'>
        {/* Event Image */}
        <div className='flex-shrink-0 w-20 overflow-hidden'>
          <img
            src={event.heroImage}
            alt={event.title}
            className='w-full h-full object-contain group-hover:scale-105 transition-transform duration-300'
          />
        </div>

        {/* Event Info */}
        <div className='flex-1 min-w-0 p-4 flex items-center'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between mb-2'>
              <div className='min-w-0 flex-1'>
                {event.title && (
                  <h3 className='font-canela font-medium text-lg truncate mb-1'>
                    {event.title}
                  </h3>
                )}
                <p className='invert-text text-foreground font-medium'>
                  {event.headliner.name}
                </p>
                {event.undercard.length > 0 && (
                  <div className='flex flex-wrap gap-1 mt-2'>
                    {event.undercard.map((artist) => (
                      <FmBadge
                        key={artist.id || artist.name}
                        label={artist.name}
                        variant='secondary'
                        className='text-xs opacity-80'
                      />
                    ))}
                  </div>
                )}
              </div>
              {isAfterHours && (
                <FmBadge
                  label='After Hours'
                  variant='primary'
                  className='ml-2 flex-shrink-0'
                />
              )}
            </div>

            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
              <div className='flex items-center gap-1'>
                <Clock className='w-3 h-3' />
                <span className='invert-text'>
                  {formatTimeDisplay(event.time)}
                </span>
              </div>
              <div className='flex items-center gap-1'>
                <MapPin className='w-3 h-3' />
                <span className='invert-text'>{event.venue}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {event.ticketUrl && (
            <div className='flex flex-col gap-2 ml-4'>
              <FmCommonButton
                variant='default'
                size='sm'
                onClick={handleTicketsClick}
                className='shimmer-on-hover bg-accent hover:bg-accent/90 text-accent-foreground font-medium'
                icon={ExternalLink}
              >
                Get Tickets
              </FmCommonButton>
            </div>
          )}
        </div>

        {/* Date Column - Right Side */}
        <FmDateBox
          weekday={dateObj.weekday}
          month={dateObj.month}
          day={dateObj.day}
          size='sm'
          className='border-l rounded-none'
        />
      </div>

      {event.ticketUrl && (
        <ExternalLinkDialog
          open={showTicketDialog}
          onOpenChange={setShowTicketDialog}
          url={event.ticketUrl}
          title='External Link'
          description="You're about to visit an external ticketing site. This will open in a new tab."
          continueText='Continue to Tickets'
        />
      )}
    </>
  );
};
