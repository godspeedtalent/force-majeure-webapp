import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Music,
  Play,
  Share2,
  Heart,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

import lfSystemCover from '@/assets/lf-system-cover.jpg';
import ninajirachiCover from '@/assets/ninajirachi-cover.jpg';
import { EventDetailsLayout } from '@/components/layout/EventDetailsLayout';
import { PageTransition } from '@/components/primitives/PageTransition';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { TicketingPanel } from '@/features/events/components/TicketingPanel';
import { SocialProof } from '@/features/events/components/SocialProof';
import { useTicketTiers } from '@/features/events/hooks/useTicketTiers';
import { useCheckout } from '@/features/events/hooks/useCheckout';
import { useSongsByEvent } from '@/features/events/hooks/useSongsByEvent';
import { supabase } from '@/shared/api/supabase/client';
import { getImageUrl } from '@/shared/utils/imageUtils';
import { formatTimeDisplay } from '@/shared/utils/timeUtils';
import { cn } from '@/shared/utils/utils';

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

  // Ticketing hooks
  const { tiers, loading: tiersLoading } = useTicketTiers(id || '');
  const { createCheckout, loading: checkoutLoading } = useCheckout();

  useEffect(() => {
    const fetchEvent = async () => {
      console.log('EventDetails mounted, fetching event:', id);

      if (!id) {
        setError('Event ID is required');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching event from database...');
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

        console.log('Event loaded successfully:', transformedEvent);
        setEvent(transformedEvent);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch event');
      } finally {
        setLoading(false);
        console.log('Loading complete');
      }
    };

    fetchEvent();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      full: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString(),
    };
  };

  const handlePurchase = async (selections: { tierId: string; quantity: number }[]) => {
    if (!id) return;

    try {
      const checkoutUrl = await createCheckout(id, selections);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  const handlePlayLineup = () => {
    if (songs.length > 0) {
      playQueue(songs);
    }
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
        // User cancelled or share failed
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-fm-gold mx-auto mb-6" />
          <p className="text-foreground text-lg font-medium">Loading event details...</p>
          <p className="text-muted-foreground text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive text-lg">{error || 'Event not found'}</p>
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const dateObj = formatDate(event.date);
  const displayTitle = event.title || event.headliner.name;

  // Left Column - Event Details
  const leftColumn = (
    <PageTransition>
      <div className="relative">
        {/* Hero Image - Morphs from card */}
        <div
          className="relative h-[60vh] lg:h-[70vh] overflow-hidden bg-muted"
          style={{ viewTransitionName: `event-hero-${id}` }}
        >
          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted-foreground/10 to-muted" />
          )}

          <img
            src={event.heroImage}
            alt={displayTitle}
            className={cn(
              'h-full w-full object-cover transition-opacity duration-500',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

          {/* Back Button */}
          <div className="absolute top-6 left-6">
            <Button
              variant="ghost"
              size="sm"
              className="bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Action Buttons - Top Right */}
          <div className="absolute top-6 right-6 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 backdrop-blur-sm hover:bg-background"
            >
              <Heart className="w-4 h-4" />
            </Button>
          </div>

          {/* Event Title - Bottom of Hero */}
          <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
            <h1 className="font-canela text-4xl lg:text-5xl font-medium text-foreground mb-2">
              {displayTitle}
            </h1>
            <p className="text-lg text-muted-foreground">
              {event.headliner.name}
            </p>
          </div>
        </div>

        {/* Date Badge - Overlapping hero and content */}
        <div className="absolute bottom-0 right-6 lg:right-8 translate-y-1/2 flex flex-col items-center justify-center w-20 h-20 bg-background border-2 border-border rounded-lg shadow-lg z-10">
          <span className="text-xs font-medium text-muted-foreground">{dateObj.month}</span>
          <span className="text-3xl font-bold text-fm-gold leading-none">{dateObj.day}</span>
        </div>

        {/* Content Section */}
        <div className="p-6 lg:p-8 pt-16 space-y-8">
          {/* Event Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-base">
              <Calendar className="w-5 h-5 text-fm-gold flex-shrink-0" />
              <span>{dateObj.full}</span>
            </div>
            <div className="flex items-center gap-3 text-base">
              <Clock className="w-5 h-5 text-fm-gold flex-shrink-0" />
              <span>{formatTimeDisplay(event.time)}</span>
            </div>
            <div className="flex items-center gap-3 text-base">
              <MapPin className="w-5 h-5 text-fm-gold flex-shrink-0" />
              <span>{event.venue}</span>
            </div>
          </div>

          {/* Play Lineup Button */}
          <Button
            onClick={handlePlayLineup}
            disabled={songsLoading || songs.length === 0}
            variant="outline"
            className="w-full border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-background"
          >
            <Play className="w-4 h-4 mr-2" />
            {songsLoading ? 'Loading...' : songs.length > 0 ? `Play Lineup (${songs.length})` : 'No Songs Available'}
          </Button>

          {/* About Event */}
          {event.description && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">About This Event</h2>
              <p className="text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          {/* Headliner */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Headliner</h2>
            <div className="bg-muted/30 border border-border rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-fm-gold/20 to-fm-gold/40 flex items-center justify-center">
                  <Music className="w-7 h-7 text-fm-gold" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{event.headliner.name}</h3>
                  <Badge variant="outline" className="text-xs mt-1">
                    {event.headliner.genre}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Supporting Artists */}
          {event.undercard.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Supporting Artists</h2>
              <div className="grid gap-3">
                {event.undercard.map((artist, index) => (
                  <div
                    key={index}
                    className="bg-muted/20 border border-border/50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/40 flex items-center justify-center">
                        <Music className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">{artist.name}</h4>
                        <p className="text-sm text-muted-foreground">{artist.genre}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );

  // Right Column - Ticketing & Social Proof
  const rightColumn = (
    <PageTransition>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Social Proof Section */}
        <SocialProof eventId={id || ''} />

        {/* Ticketing Panel */}
        {tiersLoading ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fm-gold mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading tickets...</p>
          </div>
        ) : tiers && tiers.length > 0 ? (
          <TicketingPanel
            eventId={id || ''}
            tiers={tiers}
            onPurchase={handlePurchase}
            isLoading={checkoutLoading}
          />
        ) : event.ticketUrl ? (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Get Tickets</h3>
            <p className="text-sm text-muted-foreground">
              Tickets for this event are available through an external provider.
            </p>
            <Button asChild className="w-full bg-fm-gold hover:bg-fm-gold/90 text-background">
              <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                Buy Tickets Externally
              </a>
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-muted-foreground">Tickets coming soon...</p>
          </div>
        )}

        {/* Quick Info Summary */}
        <div className="bg-muted/30 border border-border rounded-lg p-5 space-y-3">
          <h3 className="font-semibold text-sm">Event Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">{dateObj.full}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium">{formatTimeDisplay(event.time)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Venue</span>
              <span className="font-medium truncate ml-4">{event.venue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lineup</span>
              <span className="font-medium">
                {event.undercard.length > 0 ? `${event.undercard.length + 1} artists` : '1 artist'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );

  return (
    <EventDetailsLayout
      leftColumn={leftColumn}
      rightColumn={rightColumn}
    />
  );
};

export default EventDetails;
