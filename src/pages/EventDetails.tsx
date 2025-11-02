import {
  ArrowLeft,
  Calendar,
  ChevronDown,
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
      // Fallback: copy to clipboard
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

  return (
    <PageTransition>
      <EventDetailsLayout
        hero={
          <div
            className='relative w-full h-full overflow-hidden'
            style={{ viewTransitionName: `hero-takeover-${id}` }}
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

            {/* Gradient overlays for depth */}
            <div className='absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80' />
            <div className='absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent' />

            {/* Hero Content - Top navigation */}
            <div className='absolute top-0 left-0 right-0 p-8 flex items-center justify-between hero-content-fade'>
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

            {/* Hero Content - Bottom details */}
            <div className='absolute bottom-0 left-0 right-0 p-8 lg:p-12 hero-content-fade'>
              <div className='max-w-6xl mx-auto'>
                {/* Event title with dramatic sizing */}
                <div className='mb-6'>
                  <h1 className='text-6xl lg:text-8xl font-bold text-white leading-none mb-4 font-canela'>
                    {displayTitle}
                  </h1>

                  {/* Undercard badges */}
                  {event.undercard && event.undercard.length > 0 && (
                    <div className='flex flex-wrap gap-2 mb-4'>
                      {event.undercard.slice(0, 3).map((artist, index) => (
                        <Badge
                          key={index}
                          variant='outline'
                          className='text-white border-white/30 bg-white/10 backdrop-blur-sm'
                        >
                          {artist.name}
                        </Badge>
                      ))}
                      {event.undercard.length > 3 && (
                        <Badge
                          variant='outline'
                          className='text-white border-white/30 bg-white/10 backdrop-blur-sm'
                        >
                          +{event.undercard.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick info row */}
                <div className='flex flex-wrap items-center gap-6 text-white/90 mb-8'>
                  <div className='flex items-center gap-2'>
                    <Calendar className='w-5 h-5 text-fm-gold' />
                    <span className='text-sm font-medium'>
                      {formatDate(event.date)}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Clock className='w-5 h-5 text-fm-gold' />
                    <span className='text-sm font-medium'>
                      {formatTimeDisplay(event.time)}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <MapPin className='w-5 h-5 text-fm-gold' />
                    <span className='text-sm font-medium'>{event.venue}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className='flex flex-wrap gap-4'>
                  <Button
                    onClick={handlePlayLineup}
                    disabled={songsLoading || songs.length === 0}
                    size='lg'
                    className='bg-white text-black hover:bg-white/90 font-medium'
                  >
                    <Play className='w-5 h-5 mr-2' />
                    {songsLoading ? 'Loading...' : songs.length > 0 ? `Play Lineup (${songs.length})` : 'No Preview Available'}
                  </Button>

                  {event.ticketUrl && (
                    <Button
                      asChild
                      size='lg'
                      className='bg-fm-gold text-background hover:bg-fm-gold/90 font-medium'
                    >
                      <a
                        href={event.ticketUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        Get Tickets
                        <ExternalLink className='w-5 h-5 ml-2' />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Scroll indicator */}
              <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2 scroll-indicator'>
                <ChevronDown className='w-8 h-8 text-white/60' />
              </div>
            </div>
          </div>
        }
        content={
          <div className='space-y-12'>
            {/* About Section */}
            <div>
              <h2 className='text-3xl font-bold mb-6 font-canela'>About This Event</h2>
              <p className='text-muted-foreground leading-relaxed text-lg'>
                {event.description || 'No description available for this event.'}
              </p>
            </div>

            {/* Headliner Section */}
            <div>
              <h2 className='text-3xl font-bold mb-6 font-canela'>Headliner</h2>
              <div className='bg-card border border-border rounded-lg p-6 hover:border-fm-gold/50 transition-colors'>
                <div className='flex items-center gap-6'>
                  <div className='w-20 h-20 rounded-full bg-gradient-to-br from-fm-gold/20 to-fm-gold/40 flex items-center justify-center'>
                    <Music className='w-10 h-10 text-fm-gold' />
                  </div>
                  <div>
                    <h3 className='text-2xl font-semibold mb-2 font-canela'>
                      {event.headliner.name}
                    </h3>
                    <Badge variant='outline' className='text-sm border-fm-gold text-fm-gold'>
                      {event.headliner.genre}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Supporting Artists */}
            {event.undercard.length > 0 && (
              <div>
                <h2 className='text-3xl font-bold mb-6 font-canela'>Supporting Artists</h2>
                <div className='grid gap-4'>
                  {event.undercard.map((artist, index) => (
                    <div
                      key={index}
                      className='bg-card border border-border rounded-lg p-5 hover:border-fm-gold/50 transition-colors'
                    >
                      <div className='flex items-center gap-4'>
                        <div className='w-14 h-14 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center'>
                          <Music className='w-7 h-7 text-muted-foreground' />
                        </div>
                        <div>
                          <h4 className='font-semibold text-lg'>{artist.name}</h4>
                          <p className='text-sm text-muted-foreground'>{artist.genre}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Details */}
            <div>
              <h2 className='text-3xl font-bold mb-6 font-canela'>Event Details</h2>
              <div className='space-y-4'>
                <div className='flex items-start gap-4 p-4 bg-card border border-border rounded-lg'>
                  <Calendar className='w-6 h-6 text-fm-gold mt-1 flex-shrink-0' />
                  <div>
                    <h3 className='font-semibold text-lg mb-1'>Date & Time</h3>
                    <p className='text-foreground'>{formatDate(event.date)}</p>
                    <p className='text-muted-foreground'>{formatTimeDisplay(event.time)}</p>
                  </div>
                </div>

                <div className='flex items-start gap-4 p-4 bg-card border border-border rounded-lg'>
                  <MapPin className='w-6 h-6 text-fm-gold mt-1 flex-shrink-0' />
                  <div>
                    <h3 className='font-semibold text-lg mb-1'>Venue</h3>
                    <p className='text-foreground'>{event.venue}</p>
                  </div>
                </div>

                <div className='flex items-start gap-4 p-4 bg-card border border-border rounded-lg'>
                  <Music className='w-6 h-6 text-fm-gold mt-1 flex-shrink-0' />
                  <div>
                    <h3 className='font-semibold text-lg mb-1'>Lineup</h3>
                    <p className='text-foreground'>{event.headliner.name}</p>
                    <p className='text-muted-foreground'>
                      {event.undercard.length > 0
                        ? `+${event.undercard.length} supporting artist${event.undercard.length > 1 ? 's' : ''}`
                        : 'Solo performance'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        ticketing={
          <div className='space-y-8'>
            {/* Placeholder for ticketing panel */}
            <div className='bg-card border border-border rounded-lg p-8'>
              <h2 className='text-3xl font-bold mb-6 font-canela'>Get Tickets</h2>

              {event.ticketUrl ? (
                <div className='space-y-6'>
                  <p className='text-muted-foreground'>
                    Tickets are available for this event. Click below to purchase.
                  </p>

                  <Button
                    asChild
                    size='lg'
                    className='w-full bg-fm-gold text-background hover:bg-fm-gold/90 font-medium'
                  >
                    <a
                      href={event.ticketUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      Buy Tickets
                      <ExternalLink className='w-5 h-5 ml-2' />
                    </a>
                  </Button>
                </div>
              ) : (
                <p className='text-muted-foreground'>
                  Ticket information coming soon.
                </p>
              )}
            </div>

            {/* Social Proof placeholder */}
            <div className='bg-card border border-border rounded-lg p-8'>
              <h3 className='text-xl font-bold mb-4 font-canela'>Who's Going?</h3>
              <div className='flex items-center gap-4 mb-4'>
                <div className='w-12 h-12 rounded-full bg-fm-gold/10 flex items-center justify-center'>
                  <Users className='w-6 h-6 text-fm-gold' />
                </div>
                <div>
                  <p className='font-semibold'>Join the community</p>
                  <p className='text-sm text-muted-foreground'>See who else is attending</p>
                </div>
              </div>
              <p className='text-sm text-muted-foreground'>
                Social proof features coming soon
              </p>
            </div>
          </div>
        }
      />
    </PageTransition>
  );
};

export default EventDetails;
