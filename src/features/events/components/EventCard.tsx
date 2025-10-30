import { MapPin, Clock, Play, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { CommonCard } from '@/components/common/CommonCard';
import { ExternalLinkDialog } from '@/components/business/ExternalLinkDialog';
import { Badge } from '@/components/ui/shadcn/badge';
import { FmCommonButton } from '@/components/ui/buttons/FmCommonButton';
import { useMusicPlayer, type Song } from '@/contexts/MusicPlayerContext';
import { supabase } from '@/shared/api/supabase/client';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
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

  return (
    <div className='event-hover-invert'>
      <CommonCard
        image={event.heroImage}
        imageAlt={`${event.title}`}
        title={event.title || ''}
        titleHidden={!event.title}
        // Remove badges from the title/overlay area; show standard title instead
        subtitleSize='lg'
        onClick={() => navigate(`/event/${event.id}`)}
      >
        {/* Display title in Canela Deck Medium if it exists */}
        {event.title && (
          <h3 className='text-foreground text-xl font-canela font-medium line-clamp-2 mb-3 invert-text'>
            {event.title}
          </h3>
        )}

        {/* Footer content: undercard badges, then time and venue */}
        {event.undercard && event.undercard.length > 0 && (
          <div className='mb-3 flex flex-wrap gap-1'>
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
        <div className='flex items-center gap-2 text-sm text-muted-foreground mb-2'>
          <Clock className='w-4 h-4' />
          <span className='invert-text'>{formatTimeDisplay(event.time)}</span>
        </div>
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <MapPin className='w-4 h-4' />
          <span className='invert-text line-clamp-1'>{event.venue}</span>
        </div>

        {/* Moved badges to footer */}
        <div className='mt-3 flex flex-wrap gap-2'>
          <Badge variant='secondary' className='invert-badge'>
            {formatDate(event.date)}
          </Badge>
          {isAfterHours && (
            <Badge className='bg-accent/20 text-accent border-accent/30'>
              After Hours
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className='mt-4 flex flex-wrap gap-2'>
          {event.ticketUrl && (
            <FmCommonButton
              size='sm'
              variant='default'
              onClick={handleTicketsClick}
              className='shimmer-on-hover bg-accent hover:bg-accent/90 text-accent-foreground'
              icon={ExternalLink}
            >
              Get Tickets
            </FmCommonButton>
          )}
          <FmCommonButton
            size='sm'
            variant='outline'
            onClick={handlePlayLineup}
            loading={playing}
            icon={Play}
          >
            {playing ? 'Loading…' : 'Play Lineup'}
          </FmCommonButton>
        </div>
      </CommonCard>

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
    </div>
  );
};
