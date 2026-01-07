import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarX } from 'lucide-react';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';
import { FmArtistUndercardCard } from '@/components/common/display/FmArtistUndercardCard';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import {
  MobileEventSwipeContainer,
  MobileEventFullCard,
  MobileTitleCard,
  MobilePastEventsHeader,
  MobileSwipeIndicator,
  MobileAutoScrollProgress,
} from '@/components/mobile';
import { useAutoScrollMode } from '@/shared/hooks/useAutoScrollMode';
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
  contentReady,
  totalPastEventsCount,
}: IndexMobileProps) {
  const { t } = useTranslation('pages');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Track when we're doing a programmatic scroll (timestamp-based for reliability)
  const programmaticScrollUntilRef = useRef<number>(0);

  // Calculate total items: 1 title card + upcoming events + past events
  const totalItems = 1 + upcomingEvents.length + pastEvents.length;

  // First past event index (0-based, after title + upcoming)
  const firstPastEventIndex = 1 + upcomingEvents.length;

  // Check if we're viewing past events
  const isViewingPastEvents = currentIndex >= firstPastEventIndex && pastEvents.length > 0;

  // Mark scroll as programmatic for a duration
  const markProgrammaticScroll = useCallback((durationMs = 1000) => {
    programmaticScrollUntilRef.current = Date.now() + durationMs;
  }, []);

  // Check if current scroll is programmatic
  const isProgrammaticScroll = useCallback(() => {
    return Date.now() < programmaticScrollUntilRef.current;
  }, []);

  // Scroll to a specific index
  const scrollToIndex = useCallback(
    (index: number) => {
      if (containerRef.current) {
        const sections = containerRef.current.querySelectorAll('[data-swipe-index]');
        if (sections[index]) {
          markProgrammaticScroll(1000);
          sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [markProgrammaticScroll]
  );

  // Store scrollToIndex in ref for use in onComplete callback
  const scrollToIndexRef = useRef(scrollToIndex);
  scrollToIndexRef.current = scrollToIndex;

  // Store currentIndex in ref for use in onComplete callback
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // Auto-scroll mode hook
  const {
    progress: autoScrollProgress,
    isActive: isAutoScrollActive,
    imageParallaxY,
    imageParallaxX,
    contentParallaxY,
    cancel: cancelAutoScroll,
  } = useAutoScrollMode({
    enabled: !userHasInteracted && totalItems > 1,
    duration: 10000,
    onComplete: () => {
      // Use refs to get current values
      const nextIndex = currentIndexRef.current + 1;
      if (nextIndex < totalItems) {
        scrollToIndexRef.current(nextIndex);
      }
    },
    skipIndices: [0], // Skip title card (index 0)
    currentIndex,
  });

  // Handle index change from swipe container
  const handleIndexChange = useCallback(
    (index: number) => {
      setCurrentIndex(index);

      // Only cancel auto-scroll if this was a user-initiated scroll
      if (!isProgrammaticScroll() && !userHasInteracted) {
        setUserHasInteracted(true);
        cancelAutoScroll();
      }
    },
    [userHasInteracted, cancelAutoScroll, isProgrammaticScroll]
  );

  // Handle auto-advance from title card (initial transition)
  const handleAutoAdvance = useCallback(() => {
    scrollToIndex(1);
  }, [scrollToIndex]);

  // Handle indicator click (always user-initiated)
  const handleIndicatorClick = useCallback(
    (index: number) => {
      // Manual interaction cancels auto-scroll
      if (!userHasInteracted) {
        setUserHasInteracted(true);
        cancelAutoScroll();
      }
      scrollToIndex(index);
    },
    [userHasInteracted, cancelAutoScroll, scrollToIndex]
  );

  // Detect touch/wheel events as user interaction
  useEffect(() => {
    if (userHasInteracted || !containerRef.current) return;

    const container = containerRef.current;

    const handleUserInteraction = () => {
      // Only count as user interaction if not during programmatic scroll
      if (!isProgrammaticScroll()) {
        setUserHasInteracted(true);
        cancelAutoScroll();
      }
    };

    // Listen for touch start (manual swipe)
    container.addEventListener('touchstart', handleUserInteraction, { passive: true });
    // Listen for wheel (desktop scroll)
    container.addEventListener('wheel', handleUserInteraction, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleUserInteraction);
      container.removeEventListener('wheel', handleUserInteraction);
    };
  }, [userHasInteracted, cancelAutoScroll, isProgrammaticScroll]);

  // Loading state
  if (!contentReady || loading) {
    return (
      <div className='flex items-center justify-center min-h-screen relative z-10'>
        <FmCommonLoadingState message={t('home.loading')} />
      </div>
    );
  }

  // Empty state - no events at all
  if (upcomingEvents.length === 0 && totalPastEventsCount === 0) {
    return (
      <div className='relative min-h-screen'>
        {/* Background */}
        <div className='fixed inset-0 z-0'>
          <TopographicBackground opacity={0.35} parallax={false} />
        </div>

        {/* Content */}
        <div className='relative z-10 flex flex-col items-center justify-center min-h-screen px-[20px]'>
          <MobileTitleCard autoAdvanceDelay={0} showScrollHint={false} />
          <div className='mt-[40px]'>
            <FmArtistUndercardCard className='mb-[40px]' />
            <FmCommonEmptyState
              icon={CalendarX}
              title={t('home.noUpcomingEvents')}
              size='sm'
              iconClassName='text-fm-gold'
            />
          </div>
        </div>
      </div>
    );
  }

  // Get parallax offsets for current card (only apply to active event card, not title)
  const getParallaxOffsets = (index: number) => {
    if (index === currentIndex && currentIndex > 0 && isAutoScrollActive) {
      return { imageParallaxY, imageParallaxX, contentParallaxY };
    }
    return { imageParallaxY: 0, imageParallaxX: 0, contentParallaxY: 0 };
  };

  return (
    <div className='relative' ref={containerRef}>
      {/* Fixed Background */}
      <div className='fixed inset-0 z-0'>
        <TopographicBackground opacity={0.35} parallax={false} />
      </div>

      {/* Swipe Container */}
      <MobileEventSwipeContainer
        onIndexChange={handleIndexChange}
        currentIndex={currentIndex}
        className='relative z-10'
      >
        {/* Title Card */}
        <MobileTitleCard
          onAutoAdvance={handleAutoAdvance}
          autoAdvanceDelay={3000}
          showScrollHint={upcomingEvents.length > 0 || pastEvents.length > 0}
          autoAdvanceCancelled={userHasInteracted}
        />

        {/* Upcoming Events */}
        {upcomingEvents.map((event, idx) => {
          const eventIndex = 1 + idx; // Title card is index 0
          const offsets = getParallaxOffsets(eventIndex);
          return (
            <MobileEventFullCard
              key={event.id}
              event={event}
              isPastEvent={false}
              imageParallaxY={offsets.imageParallaxY}
              imageParallaxX={offsets.imageParallaxX}
              contentParallaxY={offsets.contentParallaxY}
            />
          );
        })}

        {/* Past Events */}
        {pastEvents.map((event, idx) => {
          const eventIndex = 1 + upcomingEvents.length + idx;
          const offsets = getParallaxOffsets(eventIndex);
          return (
            <MobileEventFullCard
              key={event.id}
              event={event}
              isPastEvent={true}
              imageParallaxY={offsets.imageParallaxY}
              imageParallaxX={offsets.imageParallaxX}
              contentParallaxY={offsets.contentParallaxY}
            />
          );
        })}
      </MobileEventSwipeContainer>

      {/* Past Events Floating Header */}
      <MobilePastEventsHeader
        visible={isViewingPastEvents}
        pastEventCount={pastEvents.length}
      />

      {/* Auto-Scroll Progress Bar */}
      <MobileAutoScrollProgress
        progress={autoScrollProgress}
        isActive={isAutoScrollActive}
      />

      {/* Pagination Indicator */}
      <MobileSwipeIndicator
        totalCount={totalItems}
        currentIndex={currentIndex}
        upcomingCount={upcomingEvents.length}
        onIndexClick={handleIndicatorClick}
      />
    </div>
  );
}
