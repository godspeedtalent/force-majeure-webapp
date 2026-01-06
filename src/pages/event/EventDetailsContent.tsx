import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared';
import { useEventViews } from '@/shared';
import { useShareEvent } from '@/features/events/hooks/useShareEvent';
import { useEventInterest } from '@/features/events/hooks/useEventInterest';
import { supabase } from '@/shared';
import { useQuery } from '@tanstack/react-query';

import { EventDetailsRecord } from './types';
import {
  EventInfoSection,
  EventHeaderActions,
  EventCallTimes,
  EventGuestList,
  AttendeeModal,
} from './components';
import { BULLET_SEPARATOR } from './components/constants';
import { useEventDetailsData } from './hooks/useEventDetailsData';
import { useAttendeeList } from './hooks/useAttendeeList';

interface EventDetailsContentProps {
  event: EventDetailsRecord;
  displayTitle: string;
}

export const EventDetailsContent = ({
  event,
  displayTitle,
}: EventDetailsContentProps) => {
  const { t } = useTranslation('pages');
  const { user } = useAuth();
  const { hasAnyRole } = useUserPermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [ticketCount] = useState(() => Math.floor(Math.random() * 100) + 50);
  const { viewCount, recordView } = useEventViews(event.id);

  // Use extracted hooks for date/time calculations and attendee list
  const {
    isPastEvent,
    longDateLabel,
    compactDateLabel,
    formattedTime,
    formattedDateTime,
    isAfterHours,
    weekdayLabel,
    monthLabel,
    dayNumber,
    yearNumber,
    callTimeLineup,
  } = useEventDetailsData(event);

  const { attendeeList, attendeePreview } = useAttendeeList(ticketCount);
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

  // Check if venue map should be shown
  const showVenueMap = (event as any).show_venue_map ?? true;

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
      description: event.venueDetails?.description ?? undefined,
      address: event.venueDetails?.address ?? undefined,
      city: event.venueDetails?.city ?? undefined,
      state: event.venueDetails?.state ?? undefined,
      zipCode: event.venueDetails?.zipCode ?? undefined,
      image: event.venueDetails?.image,
      logo: event.venueDetails?.logo,
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
            title={t('eventDetails.about')}
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
          isPastEvent={isPastEvent}
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
      isPastEvent={isPastEvent}
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
                {event.venue || t('eventDetails.venueTba')}
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
                        <FmBigButton onClick={handleOpenCheckout} isPastEvent={isPastEvent}>
                          {t('eventDetails.getTickets')}
                        </FmBigButton>
                      </div>

                      <div className='mt-4'>{detailsContent}</div>
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

      <AttendeeModal
        open={isAttendeeModalOpen}
        onOpenChange={setIsAttendeeModalOpen}
        attendeeList={attendeeList}
      />

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
        showMap={showVenueMap}
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
