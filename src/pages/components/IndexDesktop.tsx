import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { FmInfoCard } from '@/components/common/data/FmInfoCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { EventCard } from '@/features/events/components/EventCard';
import { EventCardSkeleton } from '@/features/events/components/EventCardSkeleton';
import { FmTbaEventCard } from '@/features/events/components/FmTbaEventCard';

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

export interface IndexDesktopProps {
  upcomingEvents: EventData[];
  pastEvents: EventData[];
  loading: boolean;
  showPastEvents: boolean;
  setShowPastEvents: (show: boolean) => void;
  heroRef: React.RefObject<HTMLDivElement>;
  eventsRef: React.RefObject<HTMLDivElement>;
  isSingleRow: boolean;
  parallaxOffset: number;
  fadeOpacity: number;
  contentReady: boolean;
}

export function IndexDesktop({
  upcomingEvents,
  pastEvents,
  loading,
  showPastEvents,
  setShowPastEvents,
  heroRef,
  eventsRef,
  isSingleRow,
  parallaxOffset,
  fadeOpacity,
  contentReady,
}: IndexDesktopProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('pages');

  if (!contentReady) {
    return (
      <div className='flex items-center justify-center min-h-screen relative z-10'>
        <FmCommonLoadingState message={t('home.loading')} />
      </div>
    );
  }

  // Single row layout (3 or fewer events) - combined hero + events on one screen
  if (isSingleRow) {
    return (
      <div className='flex flex-col justify-between py-8 pb-[100px] px-4 relative z-10'>
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
              {/* Decorative Divider */}
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
                      {t('home.lineupComingSoon')}
                    </h2>
                    <p className='text-sm text-muted-foreground mb-[10px]'>
                      {t('home.artistQuestion')}
                    </p>
                    <p className='text-sm text-muted-foreground mb-[20px]'>
                      {t('home.registerBelow')}
                    </p>
                    <FmCommonButton onClick={() => navigate('/artists/signup')}>
                      {t('home.artistRegistration')}
                    </FmCommonButton>
                  </FmInfoCard>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multi-row layout (more than 3 events) - scrollable hero + events sections
  const heroContent = (
    <section
      ref={heroRef}
      className='min-h-screen pt-24 pb-32 flex items-center justify-center px-4'
      data-section-id='hero'
    >
      <div
        className='max-w-7xl mx-auto'
        style={{
          transform: `translateY(${parallaxOffset}px)`,
          opacity: fadeOpacity,
          transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
          willChange: 'transform, opacity',
        }}
      >
        <div className='flex flex-col items-center text-center'>
          <ForceMajeureLogo size='xl' className='mb-8 h-40 w-40' />
          <h1
            className='text-3xl lg:text-5xl font-screamer leading-none mb-10'
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
    </section>
  );

  const eventsContent = (
    <section
      ref={eventsRef}
      className='min-h-screen py-24 px-4'
      data-section-id='events'
    >
      <div className='max-w-7xl mx-auto animate-fade-in w-full'>
        {/* Upcoming Events */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 justify-items-center'>
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
            <div className='col-span-full flex justify-center'>
              <FmInfoCard className='max-w-2xl text-center'>
                <h2 className='text-lg lg:text-xl text-fm-gold mb-[20px]'>
                  {t('home.lineupComingSoon')}
                </h2>
                <p className='text-sm text-muted-foreground mb-[10px]'>
                  {t('home.artistQuestion')}
                </p>
                <p className='text-sm text-muted-foreground mb-[20px]'>
                  {t('home.registerBelow')}
                </p>
                <FmCommonButton onClick={() => navigate('/artists/signup')}>
                  {t('home.artistRegistration')}
                </FmCommonButton>
              </FmInfoCard>
            </div>
          )}
        </div>

        {/* Display Past Events Button */}
        {!loading && pastEvents.length > 0 && (
          <div className='flex justify-center mt-[40px]'>
            <FmCommonButton
              onClick={() => setShowPastEvents(!showPastEvents)}
              variant='secondary'
            >
              {showPastEvents ? t('home.hidePastEvents') : t('home.showPastEvents')}
            </FmCommonButton>
          </div>
        )}

        {/* Past Events Section */}
        {!loading && showPastEvents && pastEvents.length > 0 && (
          <div className='mt-[60px]'>
            <h2 className='text-2xl lg:text-3xl font-canela text-fm-gold mb-[40px] text-center'>
              {t('home.pastEventsTitle')}
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 justify-items-center'>
              {pastEvents.map(event =>
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
                  <EventCard key={event.id} event={event} isSingleRow={false} isPastEvent />
                )
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className='relative z-10'>
      {heroContent}
      {eventsContent}
    </div>
  );
}
