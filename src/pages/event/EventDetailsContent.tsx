import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, MapPin, Moon } from 'lucide-react';
import { Badge } from '@/components/common/shadcn/badge';

import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { FmBigButton } from '@/components/common/buttons/FmBigButton';
import { FmRsvpButton } from '@/components/events/ticketing/FmRsvpButton';
import { FmDateBox } from '@/components/common/display/FmDateBox';
import { FmTextLink } from '@/components/common/display/FmTextLink';
import { FmUndercardList } from '@/components/common/display/FmUndercardList';
import { FmDynamicStickyHeader } from '@/components/common/layout/FmDynamicStickyHeader';
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
  EventPartners,
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
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const { hasAnyRole } = useUserPermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const { viewCount, isLoading: isViewCountLoading, recordView } = useEventViews(event.id);

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

  const { attendeePreview, totalGoingCount } = useAttendeeList(event.id);
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

  // Check event settings for guest list (now controlled per-event, no global feature flag)
  const { data: guestListEnabled } = useQuery({
    queryKey: ['guest-list-enabled', event.id],
    queryFn: async () => {
      const { data: settingsData } = await supabase
        .from('guest_list_settings')
        .select('*')
        .eq('event_id', event.id)
        .maybeSingle();

      return settingsData?.is_enabled ?? false;
    },
  });

  // Check if view count should be shown
  const showViewCount = (event as any).show_view_count ?? true;

  // Check if venue map should be shown
  const showVenueMap = (event as any).show_venue_map ?? true;

  // Check if this is a free event (uses RSVP instead of ticketing)
  const isFreeEvent = (event as any).is_free_event ?? false;

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
      instagram: event.venueDetails?.instagram,
      facebook: event.venueDetails?.facebook,
      youtube: event.venueDetails?.youtube,
      tiktok: event.venueDetails?.tiktok,
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

  const handleManageOrganization = useCallback(
    (organizationId: string) => {
      navigate(`/admin/organizations/${organizationId}`);
    },
    [navigate]
  );

  const detailsContent = (
    <>
      {/* Unified grid - items flow to fill gaps */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 cascade-item min-w-0 overflow-hidden'>
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
            ticketCount={totalGoingCount}
            viewCount={viewCount}
            showViewCount={showViewCount}
            isViewCountLoading={isViewCountLoading}
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
          venueLogo={event.venueDetails?.logo}
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

        {/* Partners - only shows if event has partner organizations */}
        <EventPartners
          eventId={event.id}
          canManage={canManage}
          onManageOrganization={handleManageOrganization}
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
      isViewCountLoading={isViewCountLoading}
      guestListEnabled={guestListEnabled ?? false}
      onInterestClick={handleInterestClick}
      onShareClick={handleOpenShareModal}
      isPastEvent={isPastEvent}
      eventData={{
        id: event.id,
        heroImage: event.heroImage,
        title: displayTitle,
        date: longDateLabel,
        time: formattedTime,
        venue: event.venue,
        location: event.venueDetails?.city && event.venueDetails?.state
          ? `${event.venueDetails.city}, ${event.venueDetails.state}`
          : undefined,
      }}
    />
  );

  const primaryHeader = (
    <div className='flex flex-col gap-5 overflow-hidden'>
      <div className='flex flex-wrap items-center gap-4 lg:flex-nowrap'>
        <FmDateBox
          weekday={weekdayLabel}
          month={monthLabel}
          day={dayNumber}
          year={yearNumber}
          size='lg'
        />
        <div className='space-y-3 min-w-0 flex-1'>
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
          <div className='flex flex-col gap-1.5 text-sm text-muted-foreground/90 tracking-wide'>
            <div className='flex items-center gap-2'>
              <MapPin className='h-4 w-4 text-fm-gold flex-shrink-0' />
              <FmTextLink onClick={handleVenueSelect}>
                {event.venue || t('eventDetails.venueTba')}
              </FmTextLink>
            </div>
            <div className='flex items-center gap-2'>
              <Clock className='h-4 w-4 text-fm-gold flex-shrink-0' />
              <span>{formattedDateTime}</span>
            </div>
            {isAfterHours && (
              <Badge className='w-fit bg-fm-gold/20 text-fm-gold border-fm-gold/40 text-[10px] px-2 py-0.5 flex items-center gap-1.5'>
                <Moon className='h-3 w-3' />
                {tCommon('eventForm.afterHoursEvent')}
              </Badge>
            )}
          </div>
        </div>
      </div>
      {headerActions}
    </div>
  );

  const stickyHeader = (
    <div className='flex items-center justify-between gap-3 overflow-hidden'>
      <div className='flex items-center gap-3 min-w-0 flex-1'>
        <div className='flex flex-col items-center justify-center rounded-none border border-border/60 bg-background/70 px-3 py-2 text-[10px] font-semibold tracking-[0.35em] text-muted-foreground/80 flex-shrink-0'>
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
      <div ref={handleContentViewportRef} className='p-6 lg:p-8'>
        <div className='mx-auto lg:max-w-[65%] space-y-8'>
          <FmDynamicStickyHeader
            primaryContent={primaryHeader}
            stickyContent={stickyHeader}
            className='pt-4'
            primaryClassName='group transition-all duration-300'
            stickyClassName='border border-border/50 bg-background/95 backdrop-blur px-4 py-3 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.7)] transition-shadow duration-300'
            stickyOffset='calc(4rem + 1.5rem)'
            scrollContainerRef={contentViewportRef}
          />

          {/* Only show ticket/RSVP button for upcoming events */}
          {!isPastEvent && (
            <div className='mt-6'>
              {isFreeEvent ? (
                <FmRsvpButton
                  eventId={event.id}
                  eventTitle={displayTitle}
                  isPastEvent={isPastEvent}
                />
              ) : (
                <FmBigButton onClick={handleOpenCheckout}>
                  {t('eventDetails.getTickets')}
                </FmBigButton>
              )}
            </div>
          )}

          <div className='mt-4'>{detailsContent}</div>
        </div>
      </div>

      <AttendeeModal
        open={isAttendeeModalOpen}
        onOpenChange={setIsAttendeeModalOpen}
        eventId={event.id}
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
