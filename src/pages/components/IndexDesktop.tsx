import { useTranslation } from 'react-i18next';
import { CalendarX, History, ChevronUp } from 'lucide-react';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';
import { FmArtistUndercardCard } from '@/components/common/display/FmArtistUndercardCard';
import { FmListSortFilter, SortDirection, DateRange } from '@/components/common/filters/FmListSortFilter';
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
  is_after_hours?: boolean;
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
  pastEventsSortBy,
  onPastEventsSortChange,
  pastEventsSortDirection,
  onPastEventsSortDirectionChange,
  pastEventsSearchText,
  onPastEventsSearchChange,
  pastEventsDateRange,
  onPastEventsDateRangeChange,
  totalPastEventsCount,
}: IndexDesktopProps) {
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
            <div className='grid grid-cols-3 gap-8 justify-items-center'>
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <EventCardSkeleton key={`skeleton-${idx}`} />
                ))
              ) : upcomingEvents.length > 0 ? (
                <>
                  {upcomingEvents.map(event =>
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
                  )}
                  {/* Empty placeholder cells to maintain 3-column layout */}
                  {Array.from({ length: 3 - upcomingEvents.length }).map((_, idx) => (
                    <div key={`placeholder-${idx}`} className='w-full max-w-[28vw] min-w-[240px]' />
                  ))}
                </>
              ) : (
                <div className='col-span-3 flex flex-col items-center w-full my-[40px]'>
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
                <div className='flex items-center justify-between mb-[40px]'>
                  <h2 className='text-2xl lg:text-3xl font-canela text-foreground'>
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
            <div className='col-span-full flex flex-col items-center w-full my-[40px]'>
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
            <div className='flex items-center justify-between mb-[40px]'>
              <h2 className='text-2xl lg:text-3xl font-canela text-foreground'>
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
    <div className='relative z-10'>
      {heroContent}
      {eventsContent}
    </div>
  );
}
