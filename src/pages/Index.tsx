import { Calendar } from 'lucide-react';
import { useEffect, useRef, useMemo, useState } from 'react';
import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { Layout } from '@/components/layout/Layout';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { EventCard } from '@/features/events/components/EventCard';
import { EventCardSkeleton } from '@/features/events/components/EventCardSkeleton';
import { supabase } from '@/shared/api/supabase/client';
import { useFontLoader } from '@/shared/hooks/useFontLoader';
import { useScrollPosition } from '@/shared/hooks/useScrollPosition';
import { SCROLL_THRESHOLDS } from '@/shared/constants/scrollThresholds';
import { getImageUrl } from '@/shared/utils/imageUtils';
import { logApiError } from '@/shared/utils/apiLogger';
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
}

const Index = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const fontsLoaded = useFontLoader();
  const scrollY = useScrollPosition();
  const [contentReady, setContentReady] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Content is ready when both fonts are loaded and data loading is complete
  useEffect(() => {
    if (fontsLoaded && !loading) {
      // Add a small delay for smooth transition
      const timer = setTimeout(() => {
        setContentReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
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
        const { data, error } = await supabase
          .from('events')
          .select(
            `
            *,
            headliner_artist:artists!events_headliner_id_fkey(id, name, genre, image_url)
          `
          )
          .order('date', {
            ascending: true,
          });
        if (error) {
          await handleFetchError('fetching events', error);
          return;
        }

        // Get undercard artists for all events
        const eventIds = data.map(event => event.id);
        const undercardArtists =
          eventIds.length > 0
            ? await Promise.all(
                eventIds.map(async (eventId) => {
                  const event = data.find(e => e.id === eventId);
                  if (
                    !event ||
                    !event.undercard_ids ||
                    event.undercard_ids.length === 0
                  ) {
                    return {
                      eventId,
                      artists: [],
                    };
                  }
                  const { data: artists, error: artistsError } = await supabase
                    .from('artists')
                    .select('id, name, genre, image_url')
                    .in('id', event.undercard_ids);
                  if (artistsError) {
                    await handleFetchError(`fetching undercard for event ${eventId}`, artistsError);
                  }
                  return {
                    eventId,
                    artists: artists || [],
                  };
                })
              )
            : [];

        // Transform the data to match the EventCard expected format
        const transformedEvents: EventData[] = data.map(event => {
          const undercard =
            undercardArtists.find(u => u.eventId === event.id)?.artists || [];
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
            undercard: undercard.map(artist => ({
              name: artist.name,
              genre: artist.genre || 'Electronic',
              image: artist.image_url || null,
            })),
            date: event.date,
            time: event.time,
            venue: event.venue,
            heroImage:
            event.hero_image || getImageUrl(event.hero_image),
            description: event.description || null,
            ticketUrl: event.ticket_url || null,
          };
        });
        setUpcomingEvents(transformedEvents);
      } catch (error) {
        await handleFetchError('in initialization', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [handleFetchError]);

  // Memoize scroll-based calculations
  const { parallaxOffset, fadeOpacity } = useMemo(() => ({
    parallaxOffset: scrollY * SCROLL_THRESHOLDS.PARALLAX_MULTIPLIER,
    fadeOpacity: Math.max(0, 1 - scrollY / SCROLL_THRESHOLDS.CONTENT_FADE),
  }), [scrollY]);

  return (
    <Layout>
      <div className='min-h-screen relative'>
        {/* Topography Background */}
        <div className='fixed inset-0 pointer-events-none'>
          <TopographicBackground opacity={0.35} />
        </div>
        <div className='fixed inset-0 bg-gradient-monochrome opacity-10 pointer-events-none' />

        {!contentReady ? (
          <div className='flex items-center justify-center min-h-screen relative z-10'>
            <FmCommonLoadingState message='Loading...' />
          </div>
        ) : (
          <div className='relative z-10 pt-24 pb-32 px-4'>
            {/* Hero Section with Parallax */}
            <div
              ref={heroRef}
              className='max-w-7xl mx-auto mb-16'
              style={{
                transform: `translateY(${parallaxOffset}px)`,
                opacity: fadeOpacity,
              }}
            >
              {/* Logo and Title Section */}
              <div className='flex flex-col items-center text-center'>
                <ForceMajeureLogo size='xl' className='mb-8 h-40 w-40' />
                
                <h1
                  className='text-3xl lg:text-5xl font-screamer tracking-[0.1em] leading-none mb-10'
                  style={{ fontWeight: 475 }}
                >
                  <span className='text-foreground'>FORCE </span>
                  <span className='bg-gradient-gold bg-clip-text text-transparent'>
                    MAJEURE
                  </span>
                </h1>
              </div>

              {/* Decorative Divider */}
              <DecorativeDivider />
            </div>

            {/* Events Grid */}
            <div className='max-w-7xl mx-auto animate-fade-in'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center'>
                {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <EventCardSkeleton key={`skeleton-${idx}`} />
                  ))
                ) : upcomingEvents.length > 0 ? (
                  upcomingEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))
                ) : (
                  <div className='col-span-full'>
                    <FmCommonEmptyState icon={Calendar} title='No upcoming events' />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
export default Index;
