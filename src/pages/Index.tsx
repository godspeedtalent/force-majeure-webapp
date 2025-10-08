import { Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';

import lfSystemCover from '@/assets/lf-system-cover.jpg';
import ninajirachiCover from '@/assets/ninajirachi-cover.jpg';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { DisplayToggle } from '@/components/DisplayToggle';
import SplitPageLayout from '@/components/layout/SplitPageLayout';
import { Badge } from '@/components/ui/badge';
import { EventCard } from '@/features/events/components/EventCard';
import { EventCardSkeleton } from '@/features/events/components/EventCardSkeleton';
import { EventRow } from '@/features/events/components/EventRow';
import { EventRowSkeleton } from '@/features/events/components/EventRowSkeleton';
import { supabase } from '@/shared/api/supabase/client';
import { useFontLoader } from '@/shared/hooks/useFontLoader';
import { getImageUrl } from '@/shared/utils/imageUtils';
import { logApiError } from '@/shared/utils/logger';
const Index = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayMode, setDisplayMode] = useState<'grid' | 'row'>('grid');
  const fontsLoaded = useFontLoader();
  const [contentReady, setContentReady] = useState(false);

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
        const imageMap = {
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
        const transformedEvents = data.map(event => {
          const undercard =
            undercardArtists.find(u => u.eventId === event.id)?.artists || [];
          return {
            id: event.id,
            title: event.title,
            headliner: event.headliner_artist
              ? {
                  name: event.headliner_artist.name,
                  genre: event.headliner_artist.genre || 'Electronic',
                  image: event.headliner_artist.image_url,
                }
              : {
                  name: 'TBA',
                  genre: 'Electronic',
                },
            undercard: undercard.map(artist => ({
              name: artist.name,
              genre: artist.genre || 'Electronic',
              image: artist.image_url,
            })),
            date: event.date,
            time: event.time,
            venue: event.venue,
            heroImage:
              imageMap[event.hero_image] || getImageUrl(event.hero_image),
            description: event.description,
            ticketUrl: event.ticket_url,
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
  return (
    <SplitPageLayout
      left={
        <div className='relative h-full flex flex-col lg:px-0 py-0 px-0'>
          {!contentReady ? (
            <div className='flex-1 flex items-center justify-center'>
              <LoadingState message='Loading...' />
            </div>
          ) : (
            // Content with fade and slide animation
            <div className='flex-1 flex flex-col justify-center animate-fade-in animate-slide-down-in'>
              <div className='max-w-2xl px-[64px]'>
                <Badge
                  variant='outline'
                  className='mb-8 border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black transition-colors duration-300'
                >
                  Promotions & A&R
                </Badge>
                <h1
                  className='text-6xl lg:text-8xl font-screamer tracking-tight mb-8 leading-none'
                  style={{ fontWeight: 475 }}
                >
                  <span className='block text-foreground'>FORCE</span>
                  <span className='block bg-gradient-gold bg-clip-text text-transparent -mt-4'>
                    MAJEURE
                  </span>
                </h1>
                <p className='text-lg lg:text-xl font-canela text-muted-foreground leading-relaxed mb-12 max-w-xl'>
                  The biggest rave fam in the world is deep in the heart of
                  Austin, TX.
                </p>
              </div>
            </div>
          )}
        </div>
      }
      right={
        <div className='p-8 h-full overflow-y-auto'>
          <div className='mb-8 flex items-center justify-between'>
            <p className='font-canela text-sm text-muted-foreground'>
              Events & Showcases
            </p>
            <div className='hidden lg:block'>
              <DisplayToggle
                displayMode={displayMode}
                onDisplayModeChange={setDisplayMode}
              />
            </div>
          </div>
          {displayMode === 'grid' ? (
            <div className='grid grid-cols-[repeat(auto-fit,minmax(280px,360px))] justify-around gap-y-6'>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <EventCardSkeleton key={`skeleton-${idx}`} />
                ))
              ) : upcomingEvents.length > 0 ? (
                upcomingEvents
                  .slice(0, 6)
                  .map(event => <EventCard key={event.id} event={event} />)
              ) : (
                <EmptyState
                  icon={Calendar}
                  title='No upcoming events'
                  className='col-span-full'
                />
              )}
            </div>
          ) : (
            <div className='space-y-4'>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <EventRowSkeleton key={`skeleton-${idx}`} />
                ))
              ) : upcomingEvents.length > 0 ? (
                upcomingEvents
                  .slice(0, 6)
                  .map(event => <EventRow key={event.id} event={event} />)
              ) : (
                <EmptyState icon={Calendar} title='No upcoming events' />
              )}
            </div>
          )}
        </div>
      }
    />
  );
};
export default Index;
