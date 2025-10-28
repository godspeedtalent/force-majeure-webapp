import { Calendar, Clock, MapPin, Play, ExternalLink } from 'lucide-react';
import { useState } from 'react';

import { ExternalLinkDialog } from '@/components/business/ExternalLinkDialog';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useSongsByEvent } from '@/features/events/hooks/useSongsByEvent';
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
  const { playQueue } = useMusicPlayer();
  const { songs: eventSongs } = useSongsByEvent(event.id);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const isAfterHours = (() => {
    const minutes = parseTimeToMinutes(event.time);
    return minutes !== null && minutes >= 120; // 2:00 AM = 120 minutes
  })();

  const handlePlayLineup = async () => {
    if (eventSongs.length > 0) {
      playQueue(eventSongs);
    }
  };

  const handleTicketsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTicketDialog(true);
  };

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
        <div className='flex-1 min-w-0 p-4 flex items-center justify-between'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between mb-2'>
              <div>
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
                    {event.undercard.map((artist, index) => (
                      <Badge
                        key={index}
                        variant='secondary'
                        className='bg-accent/20 text-accent border-accent/30 text-xs'
                      >
                        {artist.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className='flex items-center gap-2'>
                <Badge
                  variant='outline'
                  className='invert-badge whitespace-nowrap'
                >
                  <Calendar className='w-3 h-3 mr-1' />
                  {formatDate(event.date)}
                </Badge>
                {isAfterHours && (
                  <Badge
                    variant='secondary'
                    className='bg-accent/20 text-accent border-accent/30'
                  >
                    After Hours
                  </Badge>
                )}
              </div>
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
          <div className='flex flex-col gap-2 ml-4'>
            {event.ticketUrl && (
              <Button
                variant='default'
                size='sm'
                onClick={handleTicketsClick}
                className='shimmer-on-hover bg-accent hover:bg-accent/90 text-accent-foreground font-medium'
              >
                <ExternalLink className='w-3 h-3 mr-1' />
                Get Tickets
              </Button>
            )}
            <Button
              variant='outline'
              size='sm'
              onClick={handlePlayLineup}
              disabled={eventSongs.length === 0}
              className='invert-button'
            >
              <Play className='w-3 h-3 mr-1' />
              Play Lineup
            </Button>
          </div>
        </div>
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
