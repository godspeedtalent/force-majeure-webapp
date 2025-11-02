import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  Music,
  Play,
  Share2,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import lfSystemCover from '@/assets/lf-system-cover.jpg';
import ninajirachiCover from '@/assets/ninajirachi-cover.jpg';
import { EventDetailsLayout } from '@/components/layout/EventDetailsLayout';
import { PageTransition } from '@/components/primitives/PageTransition';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import { FmCommonButton } from '@/components/ui/buttons/FmCommonButton';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useSongsByEvent } from '@/features/events/hooks/useSongsByEvent';
import { supabase } from '@/shared/api/supabase/client';
import { cn } from '@/shared/utils/utils';
import { getImageUrl } from '@/shared/utils/imageUtils';
import { formatTimeDisplay } from '@/shared/utils/timeUtils';

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

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { playQueue } = useMusicPlayer();
  const { songs, loading: songsLoading } = useSongsByEvent(id || null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setError('Event ID is required');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('events')
          .select(
            `
            *,
            headliner_artist:artists!events_headliner_id_fkey(name, genre, image_url)
          `
          )
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        // Map of database image paths to imported images
        const imageMap = {
          '/src/assets/ninajirachi-cover.jpg': ninajirachiCover,
          '/src/assets/lf-system-cover.jpg': lfSystemCover,
        };

        // Fetch undercard artists separately
        let undercardArtists: Array<{ name: string; genre: string | null; image_url: string | null }> = [];
        if (data.undercard_ids && data.undercard_ids.length > 0) {
          const { data: undercardData } = await supabase
            .from('artists')
            .select('name, genre, image_url')
            .in('id', data.undercard_ids);
          undercardArtists = undercardData || [];
        }

        const transformedEvent: Event = {
          id: data.id,
          title: data.title,
          headliner: data.headliner_artist
            ? {
                name: data.headliner_artist.name,
                genre: data.headliner_artist.genre || 'Electronic',
                image: data.headliner_artist.image_url || null,
              }
            : {
                name: 'TBA',
                genre: 'Electronic',
                image: null,
              },
          undercard: undercardArtists.map(artist => ({
            name: artist.name,
            genre: artist.genre || 'Electronic',
            image: artist.image_url || null,
          })),
          date: data.date,
          time: data.time,
          venue: data.venue,
          heroImage: (data.hero_image && imageMap[data.hero_image as keyof typeof imageMap]) || getImageUrl(data.hero_image),
          description: data.description || null,
          ticketUrl: data.ticket_url || null,
        };

        setEvent(transformedEvent);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString(),
      year: date.getFullYear(),
    };
  };

  const handleShare = async () => {
    if (navigator.share && event) {
      try {
        await navigator.share({
          title: event.title || event.headliner.name,
          text: `Check out ${event.headliner.name} at ${event.venue}!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handlePlayLineup = () => {
    if (songs.length > 0) {
      playQueue(songs);
      toast.success(`Playing ${songs.length} tracks from the lineup`);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen flex-col gap-6 bg-background'>
        <div className='animate-spin rounded-full h-16 w-16 border-b-4 border-fm-gold' />
        <p className='text-foreground text-lg font-medium'>Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className='flex items-center justify-center h-screen flex-col gap-4 bg-background'>
        <p className='text-destructive text-lg'>{error || 'Event not found'}</p>
        <FmCommonButton asChild variant='outline' icon={ArrowLeft}>
          <Link to='/'>Back to Events</Link>
        </FmCommonButton>
      </div>
    );
  }

  const displayTitle = event.title || event.headliner.name;
  const dateInfo = formatDateShort(event.date);

  return (
    <PageTransition>
      <EventDetailsLayout
        leftColumn={
          <div
            className='relative w-full h-full'
            style={{ viewTransitionName: `magazine-hero-${id}` }}
          >
            {/* Hero Image */}
            <img
              src={event.heroImage}
              alt={displayTitle}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-700',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
            />

            {/* Loading skeleton */}
            {!imageLoaded && (
              <div className='absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted-foreground/10 to-muted' />
            )}

            {/* Gradient overlays */}
            <div className='absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90' />

            {/* Hero content overlay */}
            <div className='absolute inset-0 p-8 lg:p-12 flex flex-col justify-between'>
              {/* Top navigation */}
              <div className='flex items-center justify-between'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => navigate('/')}
                  className='text-white hover:bg-white/10 backdrop-blur-sm'
                >
                  <ArrowLeft className='w-4 h-4 mr-2' />
                  Back
                </Button>

                <div className='flex items-center gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleShare}
                    className='text-white hover:bg-white/10 backdrop-blur-sm'
                  >
                    <Share2 className='w-4 h-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-white hover:bg-white/10 backdrop-blur-sm'
                  >
                    <Heart className='w-4 h-4' />
                  </Button>
                </div>
              </div>

              {/* Bottom content */}
              <div>
                {/* Date badge - magazine style */}
                <div className='inline-flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded-lg p-4 mb-4 shadow-lg'>
                  <span className='text-xs font-semibold text-muted-foreground tracking-wider'>
                    {dateInfo.month}
                  </span>
                  <span className='text-4xl font-bold text-fm-gold leading-none my-1'>
                    {dateInfo.day}
                  </span>
                  <span className='text-xs font-medium text-muted-foreground'>
                    {dateInfo.year}
                  </span>
                </div>

                {/* Event title */}
                <h1 className='text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 font-canela'>
                  {displayTitle}
                </h1>

                {/* Venue and time */}
                <div className='flex flex-col gap-2 text-white/90 mb-6'>
                  <div className='flex items-center gap-2'>
                    <MapPin className='w-4 h-4 text-fm-gold' />
                    <span className='text-sm font-medium'>{event.venue}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Clock className='w-4 h-4 text-fm-gold' />
                    <span className='text-sm font-medium'>
                      {formatTimeDisplay(event.time)}
                    </span>
                  </div>
                </div>

                {/* Undercard badges */}
                {event.undercard && event.undercard.length > 0 && (
                  <div className='flex flex-wrap gap-2'>
                    {event.undercard.slice(0, 2).map((artist, index) => (
                      <Badge
                        key={index}
                        variant='outline'
                        className='text-white border-white/30 bg-white/10 backdrop-blur-sm'
                      >
                        {artist.name}
                      </Badge>
                    ))}
                    {event.undercard.length > 2 && (
                      <Badge
                        variant='outline'
                        className='text-white border-white/30 bg-white/10 backdrop-blur-sm'
                      >
                        +{event.undercard.length - 2} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        }
        rightColumn={
          <div className='p-8 lg:p-12 space-y-12'>
            {/* Header with action buttons - cascade item 1 */}
            <div className='cascade-item'>
              <div className='flex flex-wrap items-center justify-between gap-4 mb-8 pb-8 border-b border-border'>
                <div>
                  <h2 className='text-3xl lg:text-4xl font-bold mb-2 font-canela'>
                    {event.headliner.name}
                  </h2>
                  <Badge variant='outline' className='border-fm-gold text-fm-gold'>
                    {event.headliner.genre}
                  </Badge>
                </div>

                <div className='flex gap-3'>
                  <Button
                    onClick={handlePlayLineup}
                    disabled={songsLoading || songs.length === 0}
                    size='lg'
                    variant='outline'
                    className='border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-background'
                  >
                    <Play className='w-4 h-4 mr-2' />
                    {songsLoading ? 'Loading...' : songs.length > 0 ? `Play (${songs.length})` : 'No Preview'}
                  </Button>

                  {event.ticketUrl && (
                    <Button
                      asChild
                      size='lg'
                      className='bg-fm-gold text-background hover:bg-fm-gold/90'
                    >
                      <a
                        href={event.ticketUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        Get Tickets
                        <ExternalLink className='w-4 h-4 ml-2' />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* About section - cascade item 2 */}
            <div className='cascade-item'>
              <h3 className='text-xl font-bold mb-4 font-canela'>About This Event</h3>
              <p className='text-muted-foreground leading-relaxed text-base'>
                {event.description || 'No description available for this event.'}
              </p>
            </div>

            {/* Supporting Artists - cascade item 3 */}
            {event.undercard.length > 0 && (
              <div className='cascade-item'>
                <h3 className='text-xl font-bold mb-6 font-canela'>Supporting Artists</h3>
                <div className='grid gap-3'>
                  {event.undercard.map((artist, index) => (
                    <div
                      key={index}
                      className='flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-fm-gold/50 transition-colors'
                    >
                      <div className='w-12 h-12 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center flex-shrink-0'>
                        <Music className='w-6 h-6 text-muted-foreground' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <h4 className='font-semibold truncate'>{artist.name}</h4>
                        <p className='text-sm text-muted-foreground'>{artist.genre}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Details - cascade item 4 */}
            <div className='cascade-item'>
              <h3 className='text-xl font-bold mb-6 font-canela'>Event Information</h3>
              <div className='grid gap-4'>
                <div className='flex items-start gap-4 p-5 bg-card border border-border rounded-lg'>
                  <Calendar className='w-5 h-5 text-fm-gold mt-0.5 flex-shrink-0' />
                  <div>
                    <h4 className='font-semibold mb-1'>Date & Time</h4>
                    <p className='text-sm text-muted-foreground'>{formatDate(event.date)}</p>
                    <p className='text-sm text-muted-foreground'>{formatTimeDisplay(event.time)}</p>
                  </div>
                </div>

                <div className='flex items-start gap-4 p-5 bg-card border border-border rounded-lg'>
                  <MapPin className='w-5 h-5 text-fm-gold mt-0.5 flex-shrink-0' />
                  <div>
                    <h4 className='font-semibold mb-1'>Venue</h4>
                    <p className='text-sm text-muted-foreground'>{event.venue}</p>
                  </div>
                </div>

                <div className='flex items-start gap-4 p-5 bg-card border border-border rounded-lg'>
                  <Music className='w-5 h-5 text-fm-gold mt-0.5 flex-shrink-0' />
                  <div>
                    <h4 className='font-semibold mb-1'>Lineup</h4>
                    <p className='text-sm text-muted-foreground'>
                      {event.headliner.name}
                      {event.undercard.length > 0 &&
                        ` + ${event.undercard.length} supporting artist${event.undercard.length > 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Proof - cascade item 5 */}
            <div className='cascade-item ticket-panel-slide'>
              <div className='bg-card border border-border rounded-lg p-8'>
                <h3 className='text-xl font-bold mb-6 font-canela'>Who's Going?</h3>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='w-14 h-14 rounded-full bg-fm-gold/10 flex items-center justify-center'>
                    <Users className='w-7 h-7 text-fm-gold' />
                  </div>
                  <div>
                    <p className='font-semibold text-lg'>Join the community</p>
                    <p className='text-sm text-muted-foreground'>
                      See who else is attending this event
                    </p>
                  </div>
                </div>
                <p className='text-sm text-muted-foreground border-t border-border pt-4'>
                  Social proof features coming soon
                </p>
              </div>
            </div>
          </div>
        }
      />
    </PageTransition>
  );
};

export default EventDetails;
