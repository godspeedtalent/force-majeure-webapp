import { MapPin, Clock, Play, ExternalLink, Calendar, Settings, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { ExternalLinkDialog } from '@/components/business/ExternalLinkDialog';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import { FmCommonContextMenu, ContextMenuAction } from '@/components/ui/modals/FmCommonContextMenu';
import { useMusicPlayer, type Song } from '@/contexts/MusicPlayerContext';
import { supabase } from '@/shared/api/supabase/client';
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
}

export const EventCard = ({ event }: EventCardProps) => {
  const navigate = useNavigate();
  const { playQueue } = useMusicPlayer();
  const [playing, setPlaying] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString(),
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

  const handlePlayLineup = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playing) return;
    setPlaying(true);
    try {
      // Get headliner and undercard artist IDs for the event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('headliner_id, undercard_ids')
        .eq('id', event.id)
        .single();

      if (eventError) throw eventError;

      const artistOrder: string[] = [];
      if (eventData?.headliner_id) artistOrder.push(eventData.headliner_id);
      if (Array.isArray(eventData?.undercard_ids))
        artistOrder.push(...eventData.undercard_ids);

      if (artistOrder.length === 0) {
        toast('No lineup available for this event yet.');
        return;
      }

      // Fetch preview songs for these artists
      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select(
          `
          *,
          artists(name)
        `
        )
        .in('artist_id', artistOrder)
        .eq('is_preview', true);

      if (songsError) throw songsError;

      const songs: Song[] = (songsData || []).map((song: any) => ({
        id: song.id,
        song_name: song.song_name,
        artist_id: song.artist_id,
        artist_name: song.artists?.name || 'Unknown Artist',
        streaming_link: song.streaming_link,
        music_source: song.music_source,
        duration: song.duration,
        is_preview: song.is_preview,
      }));

      if (songs.length === 0) {
        toast('No preview tracks found for this lineup.');
        return;
      }

      // Order songs by artist order so headliner appears first
      const ordered = songs.sort(
        (a, b) =>
          artistOrder.indexOf(a.artist_id) - artistOrder.indexOf(b.artist_id)
      );

      playQueue(ordered, 0);
      toast.success('Playing event lineup');
    } catch (err: any) {
      console.error('Failed to play lineup', err);
      toast.error('Failed to load lineup');
    } finally {
      setPlaying(false);
    }
  };

  const handleTicketsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTicketDialog(true);
  };

  const handleCardClick = () => {
    console.log('Card clicked, navigating to:', `/event/${event.id}`);

    // Use View Transitions API if supported
    if ('startViewTransition' in document) {
      console.log('Using View Transitions API');
      (document as any).startViewTransition(() => {
        navigate(`/event/${event.id}`);
      });
    } else {
      // Fallback for browsers that don't support View Transitions
      console.log('View Transitions not supported, using regular navigation');
      navigate(`/event/${event.id}`);
    }
  };

  const dateObj = formatDate(event.date);

  // Determine the display title - use event title if available, otherwise headliner name
  const displayTitle = event.title || event.headliner.name;

  // Context menu actions for admin/developer
  const contextMenuActions: ContextMenuAction<Event>[] = [
    {
      label: 'Manage Event',
      icon: <Settings className="w-4 h-4" />,
      onClick: (eventData) => {
        navigate(`/events/${eventData.id}/manage`);
      },
    },
    {
      label: 'Cancel',
      icon: <X className="w-4 h-4" />,
      onClick: () => {
        // Just closes the menu, no action needed
      },
    },
  ];

  return (
    <>
      <FmCommonContextMenu
        actions={contextMenuActions}
        data={event}
        onOpenChange={setContextMenuOpen}
      >
        <div
          className={cn(
            'group relative overflow-hidden rounded-lg border border-border bg-card',
            'transition-all duration-300 cursor-pointer aspect-[2/3]',
            // Apply hover state when actually hovering OR when context menu is open
            contextMenuOpen && 'border-fm-gold/50 shadow-lg shadow-fm-gold/10',
            'hover:border-fm-gold/50 hover:shadow-lg hover:shadow-fm-gold/10'
          )}
          onClick={handleCardClick}
        >
        {/* Hero Image Section - Takes up more space for 2:3 ratio */}
        <div
          className="relative h-[65%] overflow-hidden bg-muted"
          style={{ viewTransitionName: `event-hero-${event.id}` }}
        >
          <img
            src={event.heroImage}
            alt={displayTitle}
            className={cn(
              'h-full w-full object-cover transition-all duration-500',
              'group-hover:scale-105',
              // Keep scaled when context menu is open
              contextMenuOpen && 'scale-105',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />

          {/* Event Title Overlay - at bottom of hero image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-canela text-2xl font-medium text-foreground line-clamp-2">
              {displayTitle}
            </h3>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative h-[35%] p-6 pt-4 flex flex-col">
          {/* Date Badge - top right of card body */}
          <div className="absolute -top-8 right-6 flex flex-col items-center justify-center w-16 h-16 bg-background border-2 border-border rounded-lg shadow-lg z-10">
            <span className="text-xs font-medium text-muted-foreground">{dateObj.month}</span>
            <span className="text-2xl font-bold text-fm-gold leading-none">{dateObj.day}</span>
          </div>

          {/* Undercard Artists */}
          {event.undercard && event.undercard.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {event.undercard.map((artist, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className={cn(
                    "text-xs transition-all duration-300",
                    "hover:bg-fm-gold hover:text-background hover:border-fm-gold hover:shadow-md hover:shadow-fm-gold/50"
                  )}
                >
                  {artist.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Event Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 text-fm-gold flex-shrink-0" />
              <span>{formatFullDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 text-fm-gold flex-shrink-0" />
              <span>{formatTimeDisplay(event.time)}</span>
              {isAfterHours && (
                <Badge variant="outline" className="ml-2 border-fm-gold text-fm-gold text-[10px] py-0 px-1.5 h-5">
                  After Hours
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-fm-gold flex-shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>

          {/* Action Buttons - Push to bottom */}
          <div className="flex gap-2 mt-auto">
            {event.ticketUrl && (
              <Button
                size="sm"
                onClick={handleTicketsClick}
                className="flex-1 bg-fm-gold hover:bg-fm-gold/90 text-background font-medium transition-all duration-200"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Get Tickets
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handlePlayLineup}
              disabled={playing}
              className={cn(
                'flex-1 border-border hover:border-fm-gold hover:text-fm-gold transition-all duration-200',
                !event.ticketUrl && 'flex-1'
              )}
            >
              <Play className="w-4 h-4 mr-2" />
              {playing ? 'Loading...' : 'Play Lineup'}
            </Button>
          </div>
        </div>
      </div>
      </FmCommonContextMenu>

      {event.ticketUrl && (
        <ExternalLinkDialog
          open={showTicketDialog}
          onOpenChange={setShowTicketDialog}
          url={event.ticketUrl}
          title="Leaving Force Majeure"
          description="You're about to be redirected to an external site to purchase tickets. Continue?"
          onStopPropagation={true}
        />
      )}
    </>
  );
};
