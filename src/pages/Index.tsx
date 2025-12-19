import { useEffect, useRef, useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/shared';
import { useFontLoader } from '@/shared';
import { useScrollPosition } from '@/shared';
import { useIsMobile } from '@/shared';
import { useScrollSnap } from '@/shared';
import { SCROLL_THRESHOLDS } from '@/shared';
import { getImageUrl } from '@/shared';
import { logApiError } from '@/shared';
import { IndexMobile } from './components/IndexMobile';
import { IndexDesktop } from './components/IndexDesktop';

interface Artist {
  name: string;
  genre: string;
  image?: string | null;
}

interface EventData {
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
  is_tba?: boolean;
  display_subtitle?: boolean;
}

const Index = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([]);
  const [pastEvents, setPastEvents] = useState<EventData[]>([]);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [loading, setLoading] = useState(true);
  const fontsLoaded = useFontLoader();
  const scrollY = useScrollPosition();
  const isMobile = useIsMobile();
  const [contentReady, setContentReady] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);

  // Determine if we have a single row of events (3 or fewer on desktop)
  const isSingleRow = !isMobile && upcomingEvents.length <= 3;

  // Mobile scroll snap functionality
  const { activeSection, scrollToSection, registerSection, unregisterSection } = useScrollSnap({
    enabled: true,
  });

  // Register sections for mobile scroll snap
  useEffect(() => {
    if (heroRef.current) {
      registerSection({ id: 'hero', ref: heroRef, label: 'Welcome' });
    }
    if (eventsRef.current) {
      registerSection({ id: 'events', ref: eventsRef, label: 'Events' });
    }
    return () => {
      unregisterSection('hero');
      unregisterSection('events');
    };
  }, [registerSection, unregisterSection]);

  // Content is ready when both fonts are loaded and data loading is complete
  useEffect(() => {
    if (fontsLoaded && !loading) {
      const timer = setTimeout(() => {
        setContentReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [fontsLoaded, loading]);

  // Reusable error handler
  const handleFetchError = async (context: string, error: any) => {
    await logApiError({
      endpoint: 'page:Index',
      method: 'FETCH',
      message: `Error ${context}`,
      details: error,
    });
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const now = new Date().toISOString();

        // Fetch upcoming events (future events, ascending order)
        const { data: upcomingData, error: upcomingError } = await supabase
          .from('events')
          .select(
            `
            *,
            headliner_artist:artists!events_headliner_id_fkey(id, name, genre, image_url),
            event_artists!left(
              artist:artists(id, name, genre, image_url)
            ),
            venues(name)
          `
          )
          .eq('status', 'published')
          .gte('start_time', now)
          .order('start_time', {
            ascending: true,
          });

        if (upcomingError) {
          await handleFetchError('fetching upcoming events', upcomingError);
          return;
        }

        // Fetch past events (past events, descending order)
        const { data: pastData, error: pastError } = await supabase
          .from('events')
          .select(
            `
            *,
            headliner_artist:artists!events_headliner_id_fkey(id, name, genre, image_url),
            event_artists!left(
              artist:artists(id, name, genre, image_url)
            ),
            venues(name)
          `
          )
          .eq('status', 'published')
          .lt('start_time', now)
          .order('start_time', {
            ascending: false,
          });

        if (pastError) {
          await handleFetchError('fetching past events', pastError);
          return;
        }

        // Transform function for reusability
        const transformEvent = (event: any): EventData => {
          const undercard = event.event_artists?.map((ea: any) => ({
            name: ea.artist.name,
            genre: ea.artist.genre || 'Electronic',
            image: ea.artist.image_url || null,
          })) || [];

          return {
            id: event.id,
            title: (event as any).title,
            headliner: event.headliner_artist
              ? {
                  name: event.headliner_artist.name,
                  genre: event.headliner_artist.genre || 'Electronic',
                  image: event.headliner_artist.image_url || null,
                }
              : {
                  name: 'TBA',
                  genre: 'Electronic',
                  image: null,
                },
            undercard,
            date: event.start_time ? new Date(event.start_time).toISOString().split('T')[0] : '',
            time: event.start_time ? new Date(event.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
            venue: event.venues?.name || 'TBA',
            heroImage: (event as any).hero_image ? getImageUrl((event as any).hero_image) : getImageUrl(null),
            description: event.description || null,
            ticketUrl: null,
            is_tba: (event as any).is_tba ?? false,
            display_subtitle: (event as any).display_subtitle ?? true,
          };
        };

        setUpcomingEvents(upcomingData.map(transformEvent));
        setPastEvents(pastData.map(transformEvent));
      } catch (error) {
        await handleFetchError('in initialization', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Memoize scroll-based calculations (reduce parallax on mobile for performance)
  const { parallaxOffset, fadeOpacity } = useMemo(
    () => ({
      parallaxOffset: scrollY * (isMobile
        ? SCROLL_THRESHOLDS.MOBILE_PARALLAX_MULTIPLIER
        : SCROLL_THRESHOLDS.PARALLAX_MULTIPLIER),
      fadeOpacity: Math.max(0, 1 - scrollY / SCROLL_THRESHOLDS.CONTENT_FADE),
    }),
    [scrollY, isMobile]
  );

  return (
    <Layout enableScrollSnap={false}>
      <div className='min-h-screen relative'>
        {isMobile ? (
          <IndexMobile
            upcomingEvents={upcomingEvents}
            pastEvents={pastEvents}
            loading={loading}
            showPastEvents={showPastEvents}
            setShowPastEvents={setShowPastEvents}
            heroRef={heroRef}
            eventsRef={eventsRef}
            activeSection={activeSection}
            scrollToSection={scrollToSection}
            contentReady={contentReady}
          />
        ) : (
          <IndexDesktop
            upcomingEvents={upcomingEvents}
            pastEvents={pastEvents}
            loading={loading}
            showPastEvents={showPastEvents}
            setShowPastEvents={setShowPastEvents}
            heroRef={heroRef}
            eventsRef={eventsRef}
            isSingleRow={isSingleRow}
            parallaxOffset={parallaxOffset}
            fadeOpacity={fadeOpacity}
            contentReady={contentReady}
          />
        )}
      </div>
    </Layout>
  );
};

export default Index;
