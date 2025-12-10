import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { FmBigButton } from '@/components/common/buttons/FmBigButton';
import { FmDateBox } from '@/components/common/display/FmDateBox';
import { FmTextLink } from '@/components/common/display/FmTextLink';
import { FmUndercardList } from '@/components/common/display/FmUndercardList';
import { FmDynamicStickyHeader } from '@/components/common/layout/FmDynamicStickyHeader';
import { ScrollBar } from '@/components/common/shadcn/scroll-area';
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import { type FmArtistRowProps } from '@/components/artist/FmArtistRow';
import {
  FmArtistDetailsModal,
  type FmArtistDetailsModalProps,
} from '@/components/artist/FmArtistDetailsModal';
import {
  FmVenueDetailsModal,
  type FmVenueDetailsModalProps,
} from '@/components/venue/FmVenueDetailsModal';
import { FmShareModal } from '@/components/common/modals/FmShareModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@force-majeure/shared';
import { useEventViews } from '@force-majeure/shared';
import { useShareEvent } from '@/features/events/hooks/useShareEvent';
import { useEventInterest } from '@/features/events/hooks/useEventInterest';
import { formatTimeDisplay } from '@force-majeure/shared';
import { supabase } from '@force-majeure/shared';
import { useQuery } from '@tanstack/react-query';

import { EventDetailsRecord } from './types';
import {
  EventInfoSection,
  EventHeaderActions,
  EventCallTimes,
  EventGuestList,
} from './components';

interface EventDetailsContentProps {
  event: EventDetailsRecord;
  displayTitle: string;
}

const ATTENDEE_PLACEHOLDERS = [
  { name: 'Sarah M.', avatar: 'SM' },
  { name: 'James K.', avatar: 'JK' },
  { name: 'Emily R.', avatar: 'ER' },
  { name: 'Alex T.', avatar: 'AT' },
  { name: 'Maya P.', avatar: 'MP' },
];

const BULLET_SEPARATOR = '\u2022';
const CALL_TIME_INTERVAL_MINUTES = 45;

export const EventDetailsContent = ({
  event,
  displayTitle,
}: EventDetailsContentProps) => {
  const { user } = useAuth();
  const { hasAnyRole } = useUserPermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [ticketCount] = useState(() => Math.floor(Math.random() * 100) + 50);
  const { viewCount, recordView } = useEventViews(event.id);
  const {
    isShareModalOpen,
    handleOpenShareModal,
    handleCloseShareModal,
    handleShare,
  } = useShareEvent({
    eventId: event.id,
    eventTitle: displayTitle,
  });
  
  // Event interest hook
  const { 
    interestCount, 
    isInterested, 
    toggleInterest, 
    isLoading: isInterestLoading 
  } = useEventInterest(event.id, displayTitle);
  
  const [selectedArtist, setSelectedArtist] =
    useState<FmArtistDetailsModalProps['artist']>(null);
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] =
    useState<FmVenueDetailsModalProps['venue']>(null);
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [isAttendeeModalOpen, setIsAttendeeModalOpen] = useState(false);

  // Check feature flag and event settings for guest list
  const { data: guestListEnabled } = useQuery({
    queryKey: ['guest-list-enabled', event.id],
    queryFn: async () => {
      // Check feature flag
      const { data: flagData } = await supabase
        .from('feature_flags')
        .select('is_enabled, environment_id, environments!inner(name)')
        .eq('flag_name', 'guest_list')
        .eq('environments.name', 'production')
        .maybeSingle();

      if (!flagData?.is_enabled) return false;

      // Check event settings
      const { data: settingsData } = await supabase
        .from('guest_list_settings')
        .select('*')
        .eq('event_id', event.id)
        .maybeSingle();

      // Guest list is enabled if:
      // - Feature flag is on
      // - Event has settings enabled
      // - At least one threshold is met (for now we'll show if enabled)
      return settingsData?.is_enabled ?? false;
    },
  });

  // Check if view count should be shown
  const showViewCount = (event as any).show_view_count ?? true;

  // Record page view on mount
  useEffect(() => {
    recordView();
  }, [recordView]);

  const contentViewportRef = useRef<HTMLDivElement | null>(null);
  const handleContentViewportRef = useCallback(
    (node: HTMLDivElement | null) => {
      contentViewportRef.current = node;
    },
    []
  );

  // Display subtitle from event data, fallback to venue if no subtitle
  const displaySubtitle = event?.subtitle || event?.venue || '';

  // Format time as: 9pm - 2am PST (just the time, no date)
  const formattedDateTime = useMemo(() => {
    // Get timezone
    const timezone = new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ')[2];

    // Parse start time (e.g., "9:00 PM")
    const startMatch = event.time?.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!startMatch) return '';

    const startHour = parseInt(startMatch[1], 10);
    const startMeridiem = (startMatch[3] || 'PM').toUpperCase();

    // If after hours, just show start time
    if (event.isAfterHours) {
      return `${startHour}${startMeridiem.toLowerCase()} ${timezone}`;
    }

    // If no end time, just show start time
    if (!event.endTime) {
      return `${startHour}${startMeridiem.toLowerCase()} ${timezone}`;
    }

    // Parse end time (e.g., "2:00 AM")
    const endMatch = event.endTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!endMatch) {
      return `${startHour}${startMeridiem.toLowerCase()} ${timezone}`;
    }

    const endHour = parseInt(endMatch[1], 10);
    const endMeridiem = (endMatch[3] || 'AM').toUpperCase();

    // Only show first meridiem if different from second
    const startMeridiemDisplay = startMeridiem !== endMeridiem ? startMeridiem.toLowerCase() : '';
    const endMeridiemDisplay = endMeridiem.toLowerCase();

    return `${startHour}${startMeridiemDisplay} - ${endHour}${endMeridiemDisplay} ${timezone}`;
  }, [event.time, event.endTime, event.isAfterHours]);

  const eventDate = useMemo(() => new Date(event.date), [event.date]);
  const longDateLabel = useMemo(
    () =>
      eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    [eventDate]
  );
  const compactDateLabel = useMemo(
    () =>
      eventDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [eventDate]
  );
  const formattedTime = useMemo(
    () => formatTimeDisplay(event.time),
    [event.time]
  );

  // Use the isAfterHours flag from event data
  const isAfterHours = event.isAfterHours;
  const weekdayLabel = useMemo(
    () =>
      eventDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    [eventDate]
  );
  const monthLabel = useMemo(
    () =>
      eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    [eventDate]
  );
  const dayNumber = useMemo(() => eventDate.getDate().toString(), [eventDate]);
  const yearNumber = useMemo(() => eventDate.getFullYear(), [eventDate]);
  const callTimeLineup = useMemo(() => {
    // Build lineup with headliner first (descending order - headliner at top)
    const lineup = [event.headliner, ...event.undercard].filter(Boolean);
    if (lineup.length === 0) {
      return [];
    }

    // Check if any artist has a set_time - if so, use real schedule data
    const hasRealSchedule = lineup.some(artist => artist.setTime);

    if (hasRealSchedule) {
      // Use actual set times from the database, sorted by set time descending (latest first)
      const lineupWithTimes = lineup.map((artist, index) => {
        let callTimeLabel = 'TBD';

        if (artist.setTime) {
          const setDate = new Date(artist.setTime);
          callTimeLabel = formatTimeDisplay(
            setDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })
          );
        }

        return {
          ...artist,
          callTime: callTimeLabel,
          roleLabel: index === 0 ? 'Headliner' : undefined,
          _setTime: artist.setTime ? new Date(artist.setTime).getTime() : 0,
        };
      });

      // Sort by set time descending (latest/headliner first)
      return lineupWithTimes
        .sort((a, b) => b._setTime - a._setTime)
        .map(({ _setTime: _, ...artist }) => artist);
    }

    // Fallback: Calculate estimated times based on event start/end time
    const startTimeMatch = event.time?.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!startTimeMatch) {
      // No valid start time - show TBD for all artists
      return lineup.map((artist, index) => ({
        ...artist,
        callTime: 'TBD',
        roleLabel: index === 0 ? 'Headliner' : undefined,
      }));
    }

    // Build start date
    let startHour = parseInt(startTimeMatch[1], 10);
    const startMinutes = parseInt(startTimeMatch[2], 10);
    const startMeridiem = (startTimeMatch[3] || 'PM').toUpperCase();

    if (startMeridiem === 'PM' && startHour !== 12) startHour += 12;
    if (startMeridiem === 'AM' && startHour === 12) startHour = 0;

    const baseDate = new Date(event.date);
    baseDate.setHours(startHour, startMinutes, 0, 0);

    // Calculate interval based on end time if available, otherwise use default
    let intervalMinutes = CALL_TIME_INTERVAL_MINUTES;

    if (event.endTime && !event.isAfterHours) {
      const endTimeMatch = event.endTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (endTimeMatch) {
        let endHour = parseInt(endTimeMatch[1], 10);
        const endMinutes = parseInt(endTimeMatch[2], 10);
        const endMeridiem = (endTimeMatch[3] || 'AM').toUpperCase();

        if (endMeridiem === 'PM' && endHour !== 12) endHour += 12;
        if (endMeridiem === 'AM' && endHour === 12) endHour = 0;

        const endDate = new Date(event.date);
        endDate.setHours(endHour, endMinutes, 0, 0);

        // If end time is before start time, it's the next day
        if (endDate <= baseDate) {
          endDate.setDate(endDate.getDate() + 1);
        }

        // Calculate total duration and divide by number of artists
        const totalDurationMinutes = (endDate.getTime() - baseDate.getTime()) / 60000;
        if (lineup.length > 1 && totalDurationMinutes > 0) {
          intervalMinutes = Math.floor(totalDurationMinutes / lineup.length);
        }
      }
    }

    // Calculate times in ascending order (first opener to headliner)
    // then reverse for display (headliner at top)
    const lineupWithTimes = lineup.map((artist, index) => {
      // Headliner plays last, so calculate from end
      const slotIndex = lineup.length - 1 - index;
      const callDate = new Date(baseDate.getTime() + slotIndex * intervalMinutes * 60_000);

      const callTimeLabel = formatTimeDisplay(
        callDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })
      );

      return {
        ...artist,
        callTime: callTimeLabel,
        roleLabel: index === 0 ? 'Headliner' : undefined,
      };
    });

    return lineupWithTimes;
  }, [event.date, event.time, event.endTime, event.isAfterHours, event.headliner, event.undercard]);
  const attendeeList = useMemo(() => {
    const baseAttendees = [...ATTENDEE_PLACEHOLDERS];
    const limit = Math.min(Math.max(ticketCount, baseAttendees.length), 64);
    const extrasNeeded = Math.max(limit - baseAttendees.length, 0);
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    const computeInitials = (value: number) => {
      const first =
        letters[Math.floor(value / letters.length) % letters.length] ?? 'A';
      const second = letters[value % letters.length] ?? 'A';
      return `${first}${second}`;
    };

    const generated = Array.from(
      { length: extrasNeeded },
      (_unused, index) => ({
        name: `Guest ${index + 1}`,
        avatar: computeInitials(index),
      })
    );

    return baseAttendees.concat(generated);
  }, [ticketCount]);
  const attendeePreview = useMemo(
    () => attendeeList.slice(0, ATTENDEE_PLACEHOLDERS.length),
    [attendeeList]
  );

  const handleOpenCheckout = () => {
    // Navigate to dedicated ticketing page
    navigate(`/event/${event.id}/tickets`);
  };

  const handleArtistSelect = (artist: FmArtistRowProps['artist']) => {
    setSelectedArtist({
      id: artist.id,
      name: artist.name,
      genre: artist.genre,
      image: artist.image,
    });
    setIsArtistModalOpen(true);
  };

  const handleArtistModalChange = (open: boolean) => {
    setIsArtistModalOpen(open);
    if (!open) {
      setSelectedArtist(null);
    }
  };

  const handleVenueSelect = () => {
    setSelectedVenue({
      id: event.venueDetails?.id,
      name: event.venue,
      address: event.venueDetails?.address ?? undefined,
      city: event.venueDetails?.city ?? undefined,
      state: event.venueDetails?.state ?? undefined,
      zipCode: event.venueDetails?.zipCode ?? undefined,
      image: event.venueDetails?.image,
      website: event.venueDetails?.website,
      googleMapsUrl: event.venueDetails?.googleMapsUrl,
    });
    setIsVenueModalOpen(true);
  };

  const handleVenueModalChange = (open: boolean) => {
    setIsVenueModalOpen(open);
    if (!open) {
      setSelectedVenue(null);
    }
  };

  const handlePromptLogin = useCallback(() => {
    navigate('/auth', { state: { from: location } });
  }, [navigate, location]);

  const canManage = hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER);

  const handleAttendeeCardClick = useCallback(() => {
    if (!user) {
      return;
    }
    setIsAttendeeModalOpen(true);
  }, [user]);

  const handleManageArtist = useCallback(
    (artistId: string) => {
      setIsArtistModalOpen(false);
      navigate(`/artists/${artistId}/manage`);
    },
    [navigate]
  );

  const handleManageVenue = useCallback(
    (venueId: string) => {
      setIsVenueModalOpen(false);
      navigate(`/venues/${venueId}/manage`);
    },
    [navigate]
  );

  const detailsContent = (
    <>
      {/* Unified grid - items flow to fill gaps */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 cascade-item'>
        {/* About This Event - only shows if description exists */}
        {event.description?.trim() && (
          <FmCommonCollapsibleSection
            title='About This Event'
            defaultExpanded={true}
            className='lg:col-span-2'
          >
            <p className='text-muted-foreground leading-relaxed text-sm'>
              {event.description}
            </p>
          </FmCommonCollapsibleSection>
        )}

        {/* Guest List - conditionally shows based on feature flag and event settings */}
        {guestListEnabled && (
          <EventGuestList
            attendeePreview={attendeePreview}
            ticketCount={ticketCount}
            viewCount={viewCount}
            showViewCount={showViewCount}
            isLoggedIn={!!user}
            onCardClick={handleAttendeeCardClick}
            onPromptLogin={handlePromptLogin}
          />
        )}

        {/* Event Information - always shows */}
        <EventInfoSection
          longDateLabel={longDateLabel}
          formattedDateTime={formattedDateTime}
          isAfterHours={isAfterHours}
          venue={event.venue}
          onVenueSelect={handleVenueSelect}
          className={!guestListEnabled ? 'lg:col-span-2' : ''}
        />

        {/* Call Times - only shows if lineup exists, spans full width */}
        <EventCallTimes
          callTimeLineup={callTimeLineup}
          onArtistSelect={handleArtistSelect}
          lookingForUndercard={event.lookingForUndercard}
          eventId={event.id}
        />
      </div>

      <DecorativeDivider marginTop='mt-8' marginBottom='mb-6' />
    </>
  );

  const shareCount = (event as any).share_count || 0;
  const minShareThreshold = (event as any).min_share_count_display ?? 0;
  const shouldShowShareCount = shareCount >= minShareThreshold;
  
  const minInterestThreshold = (event as any).min_interest_count_display ?? 0;
  const shouldShowInterestCount = interestCount >= minInterestThreshold;

  // Handle interest click for unauthenticated users
  const handleInterestClick = () => {
    if (!user) {
      // Redirect to auth with pending action
      navigate('/auth', {
        state: {
          from: location,
          pendingAction: {
            type: 'mark-interested',
            eventId: event.id,
            eventTitle: displayTitle,
          },
        },
      });
      return;
    }

    toggleInterest();
  };

  const headerActions = (
    <EventHeaderActions
      isInterested={isInterested}
      isInterestLoading={isInterestLoading}
      interestCount={interestCount}
      shouldShowInterestCount={shouldShowInterestCount}
      shareCount={shareCount}
      shouldShowShareCount={shouldShowShareCount}
      viewCount={viewCount}
      showViewCount={showViewCount}
      guestListEnabled={guestListEnabled ?? false}
      onInterestClick={handleInterestClick}
      onShareClick={handleOpenShareModal}
    />
  );

  const primaryHeader = (
    <div className='flex flex-col gap-5'>
      <div className='flex flex-wrap items-center gap-4 lg:flex-nowrap'>
        <FmDateBox
          weekday={weekdayLabel}
          month={monthLabel}
          day={dayNumber}
          year={yearNumber}
          size='lg'
        />
        <div className='space-y-3'>
          <div className='space-y-0.5'>
            <h1 className='text-3xl lg:text-4xl font-canela font-medium text-foreground leading-tight'>
              {displayTitle}
            </h1>
            {displaySubtitle && (
              <p className='text-lg text-muted-foreground font-normal'>
                {displaySubtitle}
              </p>
            )}
          </div>
          <FmUndercardList
            artists={event.undercard}
            onArtistClick={artist =>
              handleArtistSelect({
                id: artist.id ?? undefined,
                name: artist.name,
                genre: artist.genre,
                image: artist.image,
              })
            }
          />
          <div className='flex flex-col gap-1.5 text-sm text-muted-foreground/90 sm:flex-row sm:flex-wrap sm:items-center tracking-wide'>
            <div className='flex items-center gap-2'>
              <Clock className='h-4 w-4 text-fm-gold flex-shrink-0' />
              <span>{formattedDateTime}</span>
            </div>
            <div className='flex items-center gap-2'>
              <MapPin className='h-4 w-4 text-fm-gold flex-shrink-0' />
              <FmTextLink onClick={handleVenueSelect}>
                {event.venue || 'Venue TBA'}
              </FmTextLink>
            </div>
          </div>
        </div>
      </div>
      {headerActions}
    </div>
  );

  const stickyHeader = (
    <div className='flex items-center justify-between gap-3'>
      <div className='flex items-center gap-3 min-w-0'>
        <div className='flex flex-col items-center justify-center rounded-none border border-border/60 bg-background/70 px-3 py-2 text-[10px] font-semibold tracking-[0.35em] text-muted-foreground/80'>
          <span>{weekdayLabel}</span>
          <span>{dayNumber}</span>
        </div>
        <div className='min-w-0'>
          <h3 className='text-sm font-semibold text-foreground truncate'>
            {displayTitle}
          </h3>
          <p className='text-xs text-muted-foreground/70 truncate'>
            {compactDateLabel} {BULLET_SEPARATOR} {formattedTime}{' '}
            {BULLET_SEPARATOR}{' '}
            <FmTextLink onClick={handleVenueSelect} className='inline'>
              {event.venue}
            </FmTextLink>
          </p>
        </div>
      </div>
      {headerActions}
    </div>
  );

  return (
    <>
      <div className='relative h-full'>
        <ScrollAreaPrimitive.Root className='relative h-full overflow-hidden'>
        <ScrollAreaPrimitive.Viewport className='h-full w-full'>
          <div className='flex flex-col'>
            <ScrollAreaPrimitive.Root className='relative flex-1 overflow-hidden'>
              <ScrollAreaPrimitive.Viewport
                ref={handleContentViewportRef}
                className='h-full w-full'
              >
                <div className='flex flex-col'>
                  <div className='p-6 lg:p-8'>
                    <div className='mx-auto w-full lg:w-[65%] space-y-8'>
                      <FmDynamicStickyHeader
                        primaryContent={primaryHeader}
                        stickyContent={stickyHeader}
                        className='pt-4'
                        primaryClassName='group transition-all duration-300'
                        stickyClassName='border border-border/50 bg-background/95 backdrop-blur px-4 py-3 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.7)] transition-shadow duration-300'
                        stickyOffset='calc(4rem + 1.5rem)'
                        scrollContainerRef={contentViewportRef}
                      />

                      <div className='mt-6'>
                        <FmBigButton onClick={handleOpenCheckout}>
                          Get Tickets
                        </FmBigButton>
                      </div>

                      <div className='pb-10 mt-4'>{detailsContent}</div>
                    </div>
                  </div>
                </div>
              </ScrollAreaPrimitive.Viewport>
              <ScrollBar orientation='vertical' />
            </ScrollAreaPrimitive.Root>
          </div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar orientation='vertical' />
      </ScrollAreaPrimitive.Root>
    </div>

      <Dialog open={isAttendeeModalOpen} onOpenChange={setIsAttendeeModalOpen}>
        <DialogContent className='max-w-md bg-background/95 backdrop-blur border border-border/60 max-h-[85vh] flex flex-col p-0 overflow-hidden'>
          <DialogHeader className='flex-shrink-0 px-6 pt-6 pb-4'>
            <DialogTitle className='font-canela text-lg'>
              Guest list
            </DialogTitle>
          </DialogHeader>

          <div className='flex-1 overflow-y-auto px-6 pb-6'>
            {/* Have Tickets Section */}
            <FmCommonCollapsibleSection
              title='Have Tickets'
              defaultExpanded={true}
              className='mb-4'
            >
              <div className='grid grid-cols-4 gap-3'>
                {attendeeList
                  .slice(0, ATTENDEE_PLACEHOLDERS.length)
                  .map((attendee, index) => (
                    <div
                      key={`${attendee.avatar}-${index}`}
                      className='flex flex-col items-center gap-2 text-center group cursor-pointer'
                      onClick={() =>
                        navigate(`/profile/${attendee.avatar.toLowerCase()}`)
                      }
                    >
                      <div className='flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-gradient-to-br from-fm-gold/15 to-fm-gold/35 text-xs font-semibold uppercase text-fm-gold transition-all duration-200 group-hover:scale-110 group-hover:border-fm-gold'>
                        {attendee.avatar}
                      </div>
                      <span className='w-full truncate text-[11px] leading-tight text-muted-foreground'>
                        {attendee.name}
                      </span>
                    </div>
                  ))}
              </div>
            </FmCommonCollapsibleSection>

            {/* Private Users Section */}
            {attendeeList.length > ATTENDEE_PLACEHOLDERS.length && (
              <FmCommonCollapsibleSection
                title='Private Guests'
                defaultExpanded={false}
                className='mb-4'
              >
                <div className='mb-3 flex items-center justify-end'>
                  <span className='text-[10px] font-light text-muted-foreground/70'>
                    +
                    {(
                      attendeeList.length -
                      ATTENDEE_PLACEHOLDERS.length -
                      4
                    ).toLocaleString()}{' '}
                    more
                  </span>
                </div>
                <div className='grid grid-cols-4 gap-3'>
                  {attendeeList
                    .slice(
                      ATTENDEE_PLACEHOLDERS.length,
                      ATTENDEE_PLACEHOLDERS.length + 4
                    )
                    .map((attendee, index) => (
                      <div
                        key={`private-${attendee.avatar}-${index}`}
                        className='flex flex-col items-center gap-2 text-center'
                      >
                        <div className='flex h-12 w-12 items-center justify-center rounded-full border border-border bg-gradient-to-br from-fm-gold/15 to-fm-gold/35 text-xs font-semibold uppercase text-fm-gold blur-sm'>
                          {attendee.avatar}
                        </div>
                        <span className='w-full truncate text-[11px] leading-tight text-muted-foreground blur-sm'>
                          {attendee.name}
                        </span>
                      </div>
                    ))}
                </div>
              </FmCommonCollapsibleSection>
            )}

            {/* Interested Section */}
            <FmCommonCollapsibleSection
              title='Interested'
              defaultExpanded={true}
              className='mb-4'
            >
              <div className='mb-3 flex items-center justify-end'>
                {attendeeList.length > 8 && (
                  <span className='text-[10px] font-light text-muted-foreground/70'>
                    +{Math.max(0, attendeeList.length - 8).toLocaleString()}{' '}
                    more
                  </span>
                )}
              </div>
              <div className='grid grid-cols-4 gap-3'>
                {attendeeList.slice(0, 8).map((attendee, index) => (
                  <div
                    key={`interested-${attendee.avatar}-${index}`}
                    className='flex flex-col items-center gap-2 text-center group cursor-pointer'
                    onClick={() =>
                      navigate(`/profile/${attendee.avatar.toLowerCase()}`)
                    }
                  >
                    <div className='flex h-12 w-12 items-center justify-center rounded-full border border-border bg-gradient-to-br from-muted-foreground/15 to-muted-foreground/35 text-xs font-semibold uppercase text-muted-foreground transition-all duration-200 group-hover:scale-110 group-hover:border-fm-gold group-hover:from-fm-gold/15 group-hover:to-fm-gold/35 group-hover:text-fm-gold'>
                      {attendee.avatar}
                    </div>
                    <span className='w-full truncate text-[11px] leading-tight text-muted-foreground'>
                      {attendee.name}
                    </span>
                  </div>
                ))}
              </div>
            </FmCommonCollapsibleSection>
          </div>
        </DialogContent>
      </Dialog>

      <FmArtistDetailsModal
        artist={selectedArtist}
        open={isArtistModalOpen}
        onOpenChange={handleArtistModalChange}
        canManage={canManage}
        onManage={handleManageArtist}
      />

      <FmVenueDetailsModal
        venue={selectedVenue}
        open={isVenueModalOpen}
        onOpenChange={handleVenueModalChange}
        canManage={canManage}
        onManage={handleManageVenue}
      />

      <FmShareModal
        open={isShareModalOpen}
        onOpenChange={handleCloseShareModal}
        title={displayTitle}
        onShare={handleShare}
        shareCount={shareCount}
        viewCount={viewCount}
        eventImage={event.heroImage}
        venueName={event.venue}
        dateTime={`${longDateLabel} • ${formattedTime}`}
        undercardArtists={event.undercard.map(artist => artist.name)}
      />
    </>
  );
};
