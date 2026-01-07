import { useTranslation } from 'react-i18next';
import { CalendarX, History, ChevronUp } from 'lucide-react';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';
import { FmArtistUndercardCard } from '@/components/common/display/FmArtistUndercardCard';
import { FmListSortFilter, SortDirection, DateRange } from '@/components/common/filters/FmListSortFilter';
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
  is_after_hours?: boolean;
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
  /** Sort field for past events */
  pastEventsSortBy: string;
  /** Callback when past events sort changes */
  onPastEventsSortChange: (value: string) => void;
  /** Sort direction for past events */
  pastEventsSortDirection: SortDirection;
  /** Callback when past events sort direction changes */
  onPastEventsSortDirectionChange: (direction: SortDirection) => void;
  /** Search text for past events */
  pastEventsSearchText: string;
  /** Callback when past events search changes */
  onPastEventsSearchChange: (value: string) => void;
  /** Date range filter for past events */
  pastEventsDateRange: DateRange;
  /** Callback when past events date range changes */
  onPastEventsDateRangeChange: (value: DateRange) => void;
  /** Total count of past events before filtering */
  totalPastEventsCount: number;
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
  pastEventsSortBy,
  onPastEventsSortChange,
  pastEventsSortDirection,
  onPastEventsSortDirectionChange,
  pastEventsSearchText,
  onPastEventsSearchChange,
  pastEventsDateRange,
  onPastEventsDateRangeChange,
  totalPastEventsCount,
}: IndexMobileProps) {
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
            <div className='flex flex-col items-center w-full my-[40px]'>
              <FmArtistUndercardCard className='mb-[40px]' />
              <FmCommonEmptyState
                icon={CalendarX}
                title={t('home.noUpcomingEvents')}
                size='sm'
                iconClassName='text-fm-gold'
              />
            </div>
          )}
        </div>

        {/* Divider between empty state and past events button */}
        {!loading && upcomingEvents.length === 0 && totalPastEventsCount > 0 && (
          <DecorativeDivider marginTop='mt-[40px]' marginBottom='mb-[20px]' opacity={0.2} />
        )}

        {/* Display Past Events Button */}
        {!loading && totalPastEventsCount > 0 && (
          <div className={`flex justify-center ${upcomingEvents.length === 0 ? 'mt-[20px]' : 'mt-[40px]'}`}>
            <FmCommonButton
              onClick={() => setShowPastEvents(!showPastEvents)}
              variant='secondary'
              icon={showPastEvents ? ChevronUp : History}
              iconPosition='left'
            >
              {showPastEvents ? t('home.hidePastEvents') : t('home.showPastEvents')}
            </FmCommonButton>
          </div>
        )}

        {/* Past Events Section */}
        {!loading && showPastEvents && totalPastEventsCount > 0 && (
          <div className='mt-[60px]'>
            <div className='flex flex-col gap-[20px] mb-[40px]'>
              <h2 className='text-2xl font-canela text-foreground'>
                {t('home.pastEventsTitle')}
              </h2>
              <FmListSortFilter
                sortBy={pastEventsSortBy}
                onSortChange={onPastEventsSortChange}
                sortOptions={[
                  { value: 'date', label: t('events.sortByDate') },
                  { value: 'name', label: t('events.sortByName') },
                ]}
                sortDirection={pastEventsSortDirection}
                onSortDirectionChange={onPastEventsSortDirectionChange}
                searchText={pastEventsSearchText}
                onSearchChange={onPastEventsSearchChange}
                dateRange={pastEventsDateRange}
                onDateRangeChange={onPastEventsDateRangeChange}
                compact
              />
            </div>
            {pastEvents.length > 0 ? (
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
            ) : (
              <FmCommonEmptyState
                icon={CalendarX}
                title={t('events.noMatchingEvents')}
                size='sm'
                iconClassName='text-fm-gold'
              />
            )}
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
