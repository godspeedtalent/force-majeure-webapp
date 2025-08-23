import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { CommonCard } from '@/components/CommonCard';
import { MapPin, Clock, Play, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useMusicPlayer, type Song } from '@/contexts/MusicPlayerContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Artist {
  name: string;
  genre: string;
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
  description: string;
  ticketUrl?: string;
}

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  const navigate = useNavigate();
  const { playQueue } = useMusicPlayer();
  const [playing, setPlaying] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format times like "9:00PM" => "9PM". Works across ranges too.
  const formatTimeDisplay = (timeStr?: string | null): string => {
    if (!timeStr) return '';
    let out = timeStr;
    // Remove :00 before AM/PM (e.g., 9:00 PM -> 9 PM)
    out = out.replace(/:00(?=\s*(?:AM|PM|am|pm)\b)/g, "");
    // Remove trailing :00 for 24h formats (e.g., 21:00 -> 21)
    out = out.replace(/:00(?!\d)/g, "");
    // Uppercase am/pm
    out = out.replace(/\b(am|pm)\b/g, (m) => m.toUpperCase());
    return out;
  };

  // Parse time string and determine if end time is at or after 2:00 AM
  const parseTimeToMinutes = (timeStr?: string | null): number | null => {
    if (!timeStr) return null;
    const clean = timeStr.trim().toLowerCase();
    // if a range provided, use the ending part
    const parts = clean.split(/\s*(?:-|–|—|to)\s*/);
    const target = parts.length > 1 ? parts[parts.length - 1] : clean;

    const m12 = target.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
    if (m12) {
      let h = parseInt(m12[1], 10);
      const min = m12[2] ? parseInt(m12[2], 10) : 0;
      const ap = m12[3].toLowerCase();
      if (ap === 'pm' && h !== 12) h += 12;
      if (ap === 'am' && h === 12) h = 0;
      return h * 60 + min;
    }

    const m24 = target.match(/^(\d{1,2})(?::(\d{2}))?$/);
    if (m24) {
      const h = parseInt(m24[1], 10);
      const min = m24[2] ? parseInt(m24[2], 10) : 0;
      if (h >= 0 && h < 24 && min >= 0 && min < 60) return h * 60 + min;
    }

    return null;
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
      if (Array.isArray(eventData?.undercard_ids)) artistOrder.push(...eventData.undercard_ids);

      if (artistOrder.length === 0) {
        toast("No lineup available for this event yet.");
        return;
      }

      // Fetch preview songs for these artists
      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select(`
          *,
          artists(name)
        `)
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
        toast("No preview tracks found for this lineup.");
        return;
      }

      // Order songs by artist order so headliner appears first
      const ordered = songs.sort((a, b) =>
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
    // Prevent navigating to event details when clicking the button
    e.stopPropagation();
  };

  return (
    <CommonCard
      image={event.heroImage}
      imageAlt={`${event.title}`}
      title={event.title}
      // Remove badges from the title/overlay area; show standard title instead
      subtitleSize="lg"
      onClick={() => navigate(`/event/${event.id}`)}
    >
      {/* Footer content: undercard list, then time and venue */}
      {event.undercard && event.undercard.length > 0 && (
        <div className="mb-2 text-sm text-muted-foreground line-clamp-2">
          {event.undercard.map((a) => a.name).join('  •  ')}
        </div>
      )}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Clock className="w-4 h-4" />
  <span>{formatTimeDisplay(event.time)}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4" />
        <span className="line-clamp-1">{event.venue}</span>
      </div>

      {/* Moved badges to footer */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="secondary">{formatDate(event.date)}</Badge>
        {isAfterHours && (
          <Badge className="bg-accent/30 text-accent-foreground border-accent/40">After Hours</Badge>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {event.ticketUrl && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="accent" onClick={handleTicketsClick}>
                <ExternalLink className="w-4 h-4" />
                Get Tickets
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Leaving Force Majeure</AlertDialogTitle>
                <AlertDialogDescription>
                  You’re about to be redirected to an external site to purchase tickets. Continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Stay Here</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(event.ticketUrl!, '_blank', 'noopener,noreferrer');
                  }}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button size="sm" variant="secondary" onClick={handlePlayLineup} disabled={playing}>
          {playing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Play Lineup
            </>
          )}
        </Button>
      </div>
    </CommonCard>
  );
};