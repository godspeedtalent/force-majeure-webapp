import { useEffect, useRef, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { FmInfoCard } from '@/components/common/data/FmInfoCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { Layout } from '@/components/layout/Layout';
import { ParallaxLayerManager } from '@/components/layout/ParallaxLayerManager';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { EventCard } from '@/features/events/components/EventCard';
import { EventCardSkeleton } from '@/features/events/components/EventCardSkeleton';
import { FmTbaEventCard } from '@/features/events/components/FmTbaEventCard';
import { MobileSectionIndicator, MobileScrollCue } from '@/components/mobile';
import { MobileScrollSnapWrapper } from '@/components/mobile/MobileScrollSnapWrapper';
import { supabase } from '@/shared/api/supabase/client';
import { useFontLoader } from '@/shared/hooks/useFontLoader';
import { useScrollPosition } from '@/shared/hooks/useScrollPosition';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useScrollSnap } from '@/shared/hooks/useScrollSnap';
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
  is_tba?: boolean;
}

const Index = () => {
  const navigate = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const fontsLoaded = useFontLoader();
  const scrollY = useScrollPosition();
  const isMobile = useIsMobile();
  const [contentReady, setContentReady] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);

  // Determine if we have a single row of events (3 or fewer on desktop, or no events with the "coming soon" card)
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
            headliner_artist:artists!events_headliner_id_fkey(id, name, genre, image_url),
            event_artists!left(
              artist:artists(id, name, genre, image_url)
            ),
            venues(name)
          `
          )
          .eq('status', 'published')
          .order('start_time', {
            ascending: true,
          });
        if (error) {
          await handleFetchError('fetching events', error);
          return;
        }

        // Transform the data to match the EventCard expected format
        const transformedEvents: EventData[] = data.map(event => {
          const undercard = event.event_artists?.map((ea: any) => ({
            name: ea.artist.name,
            genre: ea.artist.genre || 'Electronic',
            image: ea.artist.image_url || null,
          })) || [];

          return {
            id: event.id,
            title: event.name,
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

  const heroContent = (
    <section
      ref={heroRef}
      className={`flex items-center justify-center px-4 ${
        isMobile ? 'h-screen snap-start snap-always' : 'min-h-screen pt-24 pb-32'
      }`}
      data-section-id='hero'
    >
      <div
        className='max-w-7xl mx-auto'
        style={
          !isMobile
            ? {
                transform: `translateY(${parallaxOffset}px)`,
                opacity: fadeOpacity,
                transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
                willChange: 'transform, opacity',
              }
            : undefined
        }
      >
        <div className='flex flex-col items-center text-center'>
          <ForceMajeureLogo size={isMobile ? 'lg' : 'xl'} className={`mb-${isMobile ? '6' : '8'} h-${isMobile ? '32' : '40'} w-${isMobile ? '32' : '40'}`} />
          <h1
            className={`${isMobile ? 'text-2xl' : 'text-3xl lg:text-5xl'} font-screamer leading-none mb-${isMobile ? '8' : '10'}`}
            style={{ fontWeight: 475 }}
          >
            <span className='text-foreground'>FORCE </span>
            <span className='bg-gradient-gold bg-clip-text text-transparent'>
              MAJEURE
            </span>
          </h1>
        </div>
        <DecorativeDivider />
      </div>
      {isMobile && <MobileScrollCue />}
    </section>
  );

  const eventsContent = (
    <section
      ref={eventsRef}
      className={`px-4 ${
        isMobile ? 'h-screen snap-start snap-always flex items-center' : 'min-h-screen py-24'
      }`}
      data-section-id='events'
    >
      <div className='max-w-7xl mx-auto animate-fade-in w-full'>
        <div className={isMobile ? 'space-y-4 overflow-y-auto max-h-[80vh]' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center'}>
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <EventCardSkeleton key={`skeleton-${idx}`} />
            ))
          ) : upcomingEvents.length > 0 ? (
            upcomingEvents.map(event =>
              event.is_tba ? (
                <FmTbaEventCard
                  key={event.id}
                  event={{
                    id: event.id,
                    date: event.date,
                    time: event.time,
                    venue: event.venue !== 'TBA' ? event.venue : undefined,
                    is_tba: true,
                  }}
                  isSingleRow={false}
                />
              ) : (
                <EventCard key={event.id} event={event} isSingleRow={false} />
              )
            )
          ) : (
            <div className={isMobile ? '' : 'col-span-full flex justify-center'}>
              <FmInfoCard className='max-w-2xl text-center'>
                <h2 className='text-lg lg:text-xl text-fm-gold mb-[20px]'>
                  Our 2026 lineup is coming soon.
                </h2>
                <p className='text-sm text-muted-foreground mb-[10px]'>
                  Are you an artist wanting to open for headlining talent?
                </p>
                <p className='text-sm text-muted-foreground mb-[20px]'>
                  Register with us below!
                </p>
                <FmCommonButton onClick={() => navigate('/artists/signup')}>
                  Artist Registration
                </FmCommonButton>
              </FmInfoCard>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  return (
    <Layout enableScrollSnap={false}>
      <div className='min-h-screen relative'>
        {!contentReady ? (
          <div className='flex items-center justify-center min-h-screen relative z-10'>
            <FmCommonLoadingState message='Loading...' />
          </div>
        ) : (
          <>
            {isMobile ? (
              <ParallaxLayerManager
                layers={[
                  {
                    id: 'topography',
                    content: <TopographicBackground opacity={0.35} parallax={false} />,
                    speed: 0.3,
                    zIndex: 1,
                  },
                  {
                    id: 'gradient',
                    content: <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />,
                    speed: 0.5,
                    zIndex: 2,
                  },
                ]}
              >
                <MobileScrollSnapWrapper enabled={true}>
                  {heroContent}
                  {eventsContent}
                  <MobileSectionIndicator
                    sections={[
                      { id: 'hero', label: 'Welcome' },
                      { id: 'events', label: 'Events' },
                    ]}
                    activeSection={activeSection}
                    onSectionClick={scrollToSection}
                  />
                </MobileScrollSnapWrapper>
              </ParallaxLayerManager>
            ) : isSingleRow ? (
              /* Single Page Layout - Combined view */
              <div className='h-screen flex flex-col justify-around py-8 px-4 relative z-10'>
                <div className='fixed inset-0 bg-gradient-monochrome opacity-10 pointer-events-none' />
                {/* Logo Section - Top Row */}
                <div className='flex items-center justify-center'>
                  <div className='max-w-7xl mx-auto'>
                    <div className='flex flex-col items-center text-center'>
                      <ForceMajeureLogo size='lg' className='mb-4 h-32 w-32' />
                      <h1
                        className='text-2xl lg:text-4xl font-screamer leading-none mb-8'
                        style={{ fontWeight: 475 }}
                      >
                        <span className='text-foreground'>FORCE </span>
                        <span className='bg-gradient-gold bg-clip-text text-transparent'>
                          MAJEURE
                        </span>
                      </h1>
                      {/* Decorative Divider - Only in single row layout */}
                      <DecorativeDivider />
                    </div>
                  </div>
                </div>

                {/* Events Section - Bottom Row */}
                <div ref={eventsRef} className='flex items-center justify-center' data-section-id='events'>
                  <div className='max-w-7xl mx-auto animate-fade-in w-full'>
                    <div className='flex justify-center items-center gap-8'>
                      {loading ? (
                        Array.from({ length: 6 }).map((_, idx) => (
                          <EventCardSkeleton key={`skeleton-${idx}`} />
                        ))
                      ) : upcomingEvents.length > 0 ? (
                        upcomingEvents.map(event =>
                          event.is_tba ? (
                            <FmTbaEventCard
                              key={event.id}
                              event={{
                                id: event.id,
                                date: event.date,
                                time: event.time,
                                venue: event.venue !== 'TBA' ? event.venue : undefined,
                                is_tba: true,
                              }}
                              isSingleRow={isSingleRow}
                            />
                          ) : (
                            <EventCard key={event.id} event={event} isSingleRow={isSingleRow} />
                          )
                        )
                      ) : (
                        <div className='flex justify-center'>
                          <FmInfoCard className='max-w-2xl text-center'>
                            <h2 className='text-lg lg:text-xl text-fm-gold mb-[20px]'>
                              Our 2026 lineup is coming soon.
                            </h2>
                            <p className='text-sm text-muted-foreground mb-[10px]'>
                              Are you an artist wanting to open for headlining talent?
                            </p>
                            <p className='text-sm text-muted-foreground mb-[20px]'>
                              Register with us below!
                            </p>
                            <FmCommonButton onClick={() => navigate('/artists/signup')}>
                              Artist Registration
                            </FmCommonButton>
                          </FmInfoCard>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className='relative z-10'>
                <div className='fixed inset-0 bg-gradient-monochrome opacity-10 pointer-events-none' />
                {heroContent}
                {eventsContent}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};
export default Index;
