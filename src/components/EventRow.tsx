import { useState } from 'react';
import { Calendar, Clock, MapPin, Play, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useSongsByEvent } from '@/hooks/useSongsByEvent';

interface Artist {
  name: string;
  genre?: string;
  image?: string;
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
  description?: string;
  ticketUrl?: string;
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
      day: 'numeric' 
    });
  };

  const formatTimeDisplay = (timeString: string) => {
    if (!timeString) return '';
    
    if (timeString.includes(' - ')) {
      const [startTime, endTime] = timeString.split(' - ');
      return `${startTime.replace(':00', '')} - ${endTime.replace(':00', '')}`;
    }
    
    return timeString.replace(':00', '');
  };

  const parseTimeToMinutes = (timeString: string) => {
    if (!timeString) return 0;
    const cleanTime = timeString.split(' - ')[0].trim();
    const [time, period] = cleanTime.split(/\s+/);
    const [hours, minutes] = time.split(':').map(Number);
    
    if (period?.toLowerCase() === 'pm' && hours !== 12) {
      return (hours + 12) * 60 + (minutes || 0);
    } else if (period?.toLowerCase() === 'am' && hours === 12) {
      return minutes || 0;
    }
    
    return hours * 60 + (minutes || 0);
  };

  const isAfterHours = parseTimeToMinutes(event.time) >= 120; // 2:00 AM = 120 minutes

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
      <div className="group flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
        {/* Event Image */}
        <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden">
          <img 
            src={event.heroImage} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Event Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg truncate">{event.title}</h3>
              <p className="text-foreground font-medium">{event.headliner.name}</p>
              {event.undercard.length > 0 && (
                <p className="text-sm text-muted-foreground truncate">
                  + {event.undercard.map(artist => artist.name).join(', ')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="whitespace-nowrap">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(event.date)}
              </Badge>
              {isAfterHours && (
                <Badge variant="secondary" className="bg-fm-crimson/20 text-fm-crimson border-fm-crimson/30">
                  After Hours
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeDisplay(event.time)}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {event.venue}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {event.ticketUrl && (
              <Button
                variant="default"
                size="sm"
                onClick={handleTicketsClick}
                className="bg-fm-gold hover:bg-fm-gold/90 text-black font-medium"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Get Tickets
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayLineup}
              disabled={eventSongs.length === 0}
            >
              <Play className="w-3 h-3 mr-1" />
              Play Lineup
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>External Link</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to visit an external ticketing site. This will open in a new tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => window.open(event.ticketUrl, '_blank')}
              className="bg-fm-gold hover:bg-fm-gold/90 text-black"
            >
              Continue to Tickets
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};