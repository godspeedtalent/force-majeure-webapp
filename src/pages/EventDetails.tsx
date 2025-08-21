import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Play, ArrowLeft, ExternalLink, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getImageUrl } from '@/lib/imageUtils';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useSongsByEvent } from '@/hooks/useSongsByEvent';
import ninajirachiCover from '@/assets/ninajirachi-cover.jpg';
import lfSystemCover from '@/assets/lf-system-cover.jpg';

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

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
          .select(`
            *,
            headliner_artist:artists!events_headliner_id_fkey(name, genre, image_url)
          `)
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        // Map of database image paths to imported images
        const imageMap = {
          '/src/assets/ninajirachi-cover.jpg': ninajirachiCover,
          '/src/assets/lf-system-cover.jpg': lfSystemCover
        };

        // Fetch undercard artists separately
        let undercardArtists = [];
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
          headliner: data.headliner_artist ? {
            name: data.headliner_artist.name,
            genre: data.headliner_artist.genre || 'Electronic',
            image: data.headliner_artist.image_url
          } : { name: 'TBA', genre: 'Electronic' },
          undercard: undercardArtists.map(artist => ({
            name: artist.name,
            genre: artist.genre || 'Electronic',
            image: artist.image_url
          })),
          date: data.date,
          time: data.time,
          venue: data.venue,
          heroImage: imageMap[data.hero_image] || getImageUrl(data.hero_image),
          description: data.description,
          ticketUrl: data.ticket_url
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh] flex-col gap-4">
          <p className="text-destructive">{error || 'Event not found'}</p>
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <img
          src={event.heroImage}
          alt={event.headliner.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Back Button */}
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 text-white hover:bg-white/20"
        >
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Link>
        </Button>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-4xl">
            <div className="relative h-32 md:h-40">
              {/* Background copy with exclusion blending */}
              <h1 className="absolute bottom-0 left-0 text-black text-8xl md:text-[12rem] font-bold opacity-30 mix-blend-exclusion pointer-events-none leading-none">
                {event.headliner.name}
              </h1>
              {/* Main heading */}
              <h1 className="absolute bottom-0 left-0 text-white text-6xl md:text-8xl font-bold z-10 leading-none">
                {event.headliner.name}
              </h1>
            </div>
            <p className="text-white/90 text-xl md:text-2xl font-medium mb-6">
              {event.title}
            </p>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => songs.length > 0 && playQueue(songs)}
                disabled={songsLoading || songs.length === 0}
                className="bg-fm-gold text-black hover:bg-fm-gold/90"
              >
                {songsLoading ? (
                  <>
                    <Music className="w-4 h-4 mr-2 animate-pulse" />
                    Loading...
                  </>
                ) : songs.length > 0 ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Play Lineup ({songs.length})
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4 mr-2" />
                    No Songs Available
                  </>
                )}
              </Button>
              
              {event.ticketUrl && (
                <Button
                  asChild
                  className="bg-fm-crimson text-white hover:bg-fm-crimson/90"
                >
                  <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                    Get Tickets
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Event Info Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="flex items-start gap-4">
            <Calendar className="w-6 h-6 text-fm-gold mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-1">Date & Time</h3>
              <p className="text-foreground">{formatDate(event.date)}</p>
              <p className="text-muted-foreground">{event.time}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <MapPin className="w-6 h-6 text-fm-gold mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-1">Venue</h3>
              <p className="text-foreground">{event.venue}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <Music className="w-6 h-6 text-fm-gold mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-1">Lineup</h3>
              <p className="text-foreground">{event.headliner.name}</p>
              <p className="text-muted-foreground">
                {event.undercard.length > 0 ? `+${event.undercard.length} more` : 'Solo performance'}
              </p>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">About This Event</h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            {event.description}
          </p>
        </div>

        {/* Headliner Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Headliner</h2>
          <div className="bg-muted/30 border border-border rounded-lg p-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                <Music className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">{event.headliner.name}</h3>
                <Badge variant="outline" className="text-sm">
                  {event.headliner.genre}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Supporting Artists */}
        {event.undercard.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Supporting Artists</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {event.undercard.map((artist, index) => (
                <div key={index} className="bg-muted/30 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/40 flex items-center justify-center">
                      <Music className="w-6 h-6 text-secondary" />
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

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          {event.ticketUrl && (
            <Button
              asChild
              size="lg"
              className="bg-fm-crimson text-white hover:bg-fm-crimson/90"
            >
              <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                Get Tickets
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          )}
          
          <Button variant="outline" size="lg">
            Share Event
          </Button>
          
          <Button
            onClick={() => songs.length > 0 && playQueue(songs)}
            disabled={songsLoading || songs.length === 0}
            variant="outline"
            size="lg"
            className="border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black"
          >
            {songsLoading ? (
              <>
                <Music className="w-4 h-4 mr-2 animate-pulse" />
                Loading Songs...
              </>
            ) : songs.length > 0 ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Play Full Lineup
              </>
            ) : (
              <>
                <Music className="w-4 h-4 mr-2" />
                No Songs Available
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;