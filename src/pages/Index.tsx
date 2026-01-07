import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
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
import { SortDirection, DateRange } from '@/components/common/filters/FmListSortFilter';

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
  is_after_hours?: boolean;
}

/** Raw event row from Supabase query with relations */
interface EventRow {
  id: string;
  title: string;
  description: string | null;
  start_time: string | null;
  hero_image: string | null;
  is_tba: boolean | null;
  display_subtitle: boolean | null;
  is_after_hours: boolean | null;
  headliner_artist: {
    id: string;
    name: string;
    genre: string | null;
    image_url: string | null;
  } | null;
  event_artists: Array<{
    artist: {
      id: string;
      name: string;
      genre: string | null;
      image_url: string | null;
    };
  }> | null;
  venues: {
    name: string;
  } | null;
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

  // Past events sorting and filtering state
  const [pastEventsSortBy, setPastEventsSortBy] = useState<string>('date');
  const [pastEventsSortDirection, setPastEventsSortDirection] = useState<SortDirection>('desc');
  const [pastEventsSearchText, setPastEventsSearchText] = useState<string>('');
  const [pastEventsDateRange, setPastEventsDateRange] = useState<DateRange>('all');

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
        const transformEvent = (event: EventRow): EventData => {
          const undercard = event.event_artists?.map((ea) => ({
            name: ea.artist.name,
            genre: ea.artist.genre || 'Electronic',
            image: ea.artist.image_url || null,
          })) || [];

          return {
            id: event.id,
            title: event.title,
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
            heroImage: event.hero_image ? getImageUrl(event.hero_image) : getImageUrl(null),
            description: event.description || null,
            ticketUrl: null,
            is_tba: event.is_tba ?? false,
            display_subtitle: event.display_subtitle ?? true,
            is_after_hours: event.is_after_hours ?? false,
          };
        };

        // Type assertion needed because Supabase's auto-generated types don't match our query shape
        setUpcomingEvents((upcomingData as unknown as EventRow[]).map(transformEvent));
        setPastEvents((pastData as unknown as EventRow[]).map(transformEvent));
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

  // Filter and sort past events based on current settings
  const sortedPastEvents = useMemo(() => {
    let filtered = [...pastEvents];

    // Apply text search filter
    if (pastEventsSearchText.trim()) {
      const searchLower = pastEventsSearchText.toLowerCase().trim();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchLower) ||
        event.headliner.name.toLowerCase().includes(searchLower) ||
        event.venue.toLowerCase().includes(searchLower)
      );
    }

    // Apply date range filter
    if (pastEventsDateRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date;

      switch (pastEventsDateRange) {
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter(event => new Date(event.date) >= cutoffDate);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (pastEventsSortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (pastEventsSortBy === 'name') {
        comparison = a.title.localeCompare(b.title);
      }
      return pastEventsSortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [pastEvents, pastEventsSortBy, pastEventsSortDirection, pastEventsSearchText, pastEventsDateRange]);

  // Callbacks for sort and filter changes
  const handlePastEventsSortChange = useCallback((value: string) => {
    setPastEventsSortBy(value);
  }, []);

  const handlePastEventsSortDirectionChange = useCallback((direction: SortDirection) => {
    setPastEventsSortDirection(direction);
  }, []);

  const handlePastEventsSearchChange = useCallback((value: string) => {
    setPastEventsSearchText(value);
  }, []);

  const handlePastEventsDateRangeChange = useCallback((value: DateRange) => {
    setPastEventsDateRange(value);
  }, []);

  return (
    <Layout enableScrollSnap={false}>
      <div className='min-h-screen relative'>
        {isMobile ? (
          <IndexMobile
            upcomingEvents={upcomingEvents}
            pastEvents={sortedPastEvents}
            loading={loading}
            showPastEvents={showPastEvents}
            setShowPastEvents={setShowPastEvents}
            heroRef={heroRef}
            eventsRef={eventsRef}
            activeSection={activeSection}
            scrollToSection={scrollToSection}
            contentReady={contentReady}
            pastEventsSortBy={pastEventsSortBy}
            onPastEventsSortChange={handlePastEventsSortChange}
            pastEventsSortDirection={pastEventsSortDirection}
            onPastEventsSortDirectionChange={handlePastEventsSortDirectionChange}
            pastEventsSearchText={pastEventsSearchText}
            onPastEventsSearchChange={handlePastEventsSearchChange}
            pastEventsDateRange={pastEventsDateRange}
            onPastEventsDateRangeChange={handlePastEventsDateRangeChange}
            totalPastEventsCount={pastEvents.length}
          />
        ) : (
          <IndexDesktop
            upcomingEvents={upcomingEvents}
            pastEvents={sortedPastEvents}
            loading={loading}
            showPastEvents={showPastEvents}
            setShowPastEvents={setShowPastEvents}
            heroRef={heroRef}
            eventsRef={eventsRef}
            isSingleRow={isSingleRow}
            parallaxOffset={parallaxOffset}
            fadeOpacity={fadeOpacity}
            contentReady={contentReady}
            pastEventsSortBy={pastEventsSortBy}
            onPastEventsSortChange={handlePastEventsSortChange}
            pastEventsSortDirection={pastEventsSortDirection}
            onPastEventsSortDirectionChange={handlePastEventsSortDirectionChange}
            pastEventsSearchText={pastEventsSearchText}
            onPastEventsSearchChange={handlePastEventsSearchChange}
            pastEventsDateRange={pastEventsDateRange}
            onPastEventsDateRangeChange={handlePastEventsDateRangeChange}
            totalPastEventsCount={pastEvents.length}
          />
        )}
      </div>
    </Layout>
  );
};

export default Index;
