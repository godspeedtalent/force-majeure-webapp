import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { FmInfoCard } from '@/components/common/data/FmInfoCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { ParallaxLayerManager } from '@/components/layout/ParallaxLayerManager';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { EventCard } from '@/features/events/components/EventCard';
import { EventCardSkeleton } from '@/features/events/components/EventCardSkeleton';
import { FmTbaEventCard } from '@/features/events/components/FmTbaEventCard';
import { MobileSectionIndicator, MobileScrollCue } from '@/components/mobile';
import { MobileScrollSnapWrapper } from '@/components/mobile/MobileScrollSnapWrapper';

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

export interface IndexMobileProps {
  upcomingEvents: EventData[];
  pastEvents: EventData[];
  loading: boolean;
  showPastEvents: boolean;
  setShowPastEvents: (show: boolean) => void;
  heroRef: React.RefObject<HTMLDivElement>;
  eventsRef: React.RefObject<HTMLDivElement>;
  activeSection: string | null;
  scrollToSection: (id: string) => void;
  contentReady: boolean;
}

export function IndexMobile({
  upcomingEvents,
  pastEvents,
  loading,
  showPastEvents,
  setShowPastEvents,
  heroRef,
  eventsRef,
  activeSection,
  scrollToSection,
  contentReady,
}: IndexMobileProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('pages');

  if (!contentReady) {
    return (
      <div className='flex items-center justify-center min-h-screen relative z-10'>
        <FmCommonLoadingState message={t('home.loading')} />
      </div>
    );
  }

  const heroContent = (
    <section
      ref={heroRef}
      className='h-screen snap-start snap-always flex items-center justify-center px-4'
      data-section-id='hero'
    >
      <div className='max-w-7xl mx-auto'>
        <div className='flex flex-col items-center text-center'>
          <ForceMajeureLogo size='lg' className='mb-6 h-32 w-32' />
          <h1
            className='text-2xl font-screamer leading-none mb-8'
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
      <MobileScrollCue />
    </section>
  );

  const eventsContent = (
    <section
      ref={eventsRef}
      className='h-screen snap-start snap-always flex items-center px-4'
      data-section-id='events'
    >
      <div className='max-w-7xl mx-auto animate-fade-in w-full'>
        {/* Upcoming Events */}
        <div className='space-y-4 overflow-y-auto max-h-[80vh]'>
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
            <div className='space-y-4'>
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
            { id: 'hero', label: t('home.welcome') },
            { id: 'events', label: t('events.title') },
          ]}
          activeSection={activeSection}
          onSectionClick={scrollToSection}
        />
      </MobileScrollSnapWrapper>
    </ParallaxLayerManager>
  );
}
