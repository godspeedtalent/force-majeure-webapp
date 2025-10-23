import { Calendar, Instagram } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import lfSystemCover from '@/assets/lf-system-cover.jpg';
import ninajirachiCover from '@/assets/ninajirachi-cover.jpg';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { DecorativeDivider } from '@/components/DecorativeDivider';
import { ForceMajeureLogo } from '@/components/ForceMajeureLogo';
import { Layout } from '@/components/layout/Layout';
import { FmCommonButton } from '@/components/FmCommonButton';
import { EventCard } from '@/features/events/components/EventCard';
import { EventCardSkeleton } from '@/features/events/components/EventCardSkeleton';
import { supabase } from '@/shared/api/supabase/client';
import { useFontLoader } from '@/shared/hooks/useFontLoader';
import { getImageUrl } from '@/shared/utils/imageUtils';
import { logApiError } from '@/shared/utils/logger';
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
  const [contentReady, setContentReady] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          console.error('Error fetching events:', error);
          await logApiError({
            endpoint: 'supabase:events',
            method: 'SELECT',
            message: 'Error fetching events',
            details: error,
          });
          return;
        }

        // Map of database image paths to imported images
        const imageMap: Record<string, string> = {
          '/src/assets/ninajirachi-cover.jpg': ninajirachiCover,
          '/src/assets/lf-system-cover.jpg': lfSystemCover,
        };

        // Get undercard artists for all events
        const eventIds = data.map(event => event.id);
        const undercardArtists =
          eventIds.length > 0
            ? await Promise.all(
                eventIds.map(async eventId => {
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
                    console.error(
                      'Error fetching undercard artists:',
                      artistsError
                    );
                    await logApiError({
                      endpoint: 'supabase:artists',
                      method: 'SELECT',
                      message: 'Error fetching undercard artists',
                      details: { eventId, error: artistsError },
                    });
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
              (event.hero_image && imageMap[event.hero_image]) || getImageUrl(event.hero_image),
            description: event.description || null,
            ticketUrl: event.ticket_url || null,
          };
        });
        setUpcomingEvents(transformedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        await logApiError({
          endpoint: 'page:Index',
          method: 'INIT',
          message: 'Unhandled error fetching events',
          details: String(error),
        });
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);
  const parallaxOffset = scrollY * 0.5;
  const fadeOpacity = Math.max(0, 1 - scrollY / 400);

  return (
    <Layout>
      <div className='min-h-screen relative'>
        {/* Topography Background */}
        <div className='fixed inset-0 bg-topographic opacity-25 bg-repeat bg-center pointer-events-none' />
        <div className='fixed inset-0 bg-gradient-monochrome opacity-10 pointer-events-none' />

        {!contentReady ? (
          <div className='flex items-center justify-center min-h-screen relative z-10'>
            <LoadingState message='Loading...' />
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
                  className='text-4xl lg:text-6xl font-screamer tracking-[0.2em] leading-none mb-6'
                  style={{ fontWeight: 475 }}
                >
                  <span className='text-foreground'>FORCE </span>
                  <span className='bg-gradient-gold bg-clip-text text-transparent'>
                    MAJEURE
                  </span>
                </h1>

                {/* Social Button */}
                <FmCommonButton
                  href='https://www.instagram.com/force.majeure.events'
                  icon={Instagram}
                  label='Follow us on Instagram'
                  isExternal={true}
                />
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
                    <EmptyState icon={Calendar} title='No upcoming events' />
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
