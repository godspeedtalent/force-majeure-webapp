import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { FmBigButton } from '@/components/common/buttons/FmBigButton';
import { FmDynamicStickyHeader } from '@/components/common/layout/FmDynamicStickyHeader';
import { ScrollBar } from '@/components/common/shadcn/scroll-area';
import { FmStickyFooter } from '@/components/common/layout';
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import type { FmArtistRowProps } from '@/components/artist/FmArtistRow';
import {
  FmArtistDetailsModal,
  type FmArtistDetailsModalProps,
} from '@/components/artist/FmArtistDetailsModal';
import {
  FmVenueDetailsModal,
  type FmVenueDetailsModalProps,
} from '@/components/venue/FmVenueDetailsModal';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserRole } from '@/shared/hooks/useUserRole';
import { useEventViews } from '@/shared/hooks/useEventViews';

import type { EventDetailsRecord } from './types';
import { useEventDetailsData } from './hooks/useEventDetailsData';
import { useAttendeeList } from './hooks/useAttendeeList';
import { GuestListSection } from './components/GuestListSection';
import { EventInformationSection } from './components/EventInformationSection';
import { CallTimesSection } from './components/CallTimesSection';
import { AttendeeModal } from './components/AttendeeModal';
import { EventHeader } from './components/EventHeader';
import { EventStickyHeader } from './components/EventStickyHeader';

interface EventDetailsContentProps {
  event: EventDetailsRecord;
  onShare: () => void;
  displayTitle: string;
}

/**
 * EventDetailsContent - Event details page component
 *
 * Refactored for better maintainability by:
 * - Extracting data computation to custom hooks
 * - Breaking UI into focused section components
 * - Separating modal logic from main component
 *
 * Main component is now a clean orchestrator (~150 lines vs 687 lines)
 */
export const EventDetailsContent = ({
  event,
  onShare,
  displayTitle,
}: EventDetailsContentProps) => {
  const { user } = useAuth();
  const { data: role } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [ticketCount] = useState(() => Math.floor(Math.random() * 100) + 50);
  const { viewCount, recordView } = useEventViews(event.id);

  // Modal states
  const [selectedArtist, setSelectedArtist] =
    useState<FmArtistDetailsModalProps['artist']>(null);
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] =
    useState<FmVenueDetailsModalProps['venue']>(null);
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [isAttendeeModalOpen, setIsAttendeeModalOpen] = useState(false);

  // Record page view on mount
  useEffect(() => {
    recordView();
  }, [recordView]);

  // Custom hooks for data computation
  const {
    longDateLabel,
    compactDateLabel,
    formattedTime,
    isAfterHours,
    weekdayLabel,
    monthLabel,
    dayNumber,
    yearNumber,
    callTimeLineup,
  } = useEventDetailsData(event);

  const { attendeeList, attendeePreview } = useAttendeeList(ticketCount);

  // Scroll viewport ref
  const contentViewportRef = useRef<HTMLDivElement | null>(null);
  const handleContentViewportRef = useCallback(
    (node: HTMLDivElement | null) => {
      contentViewportRef.current = node;
    },
    []
  );

  // Event handlers
  const handleOpenCheckout = () => {
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
      name: event.venue,
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

  const handleAttendeeCardClick = useCallback(() => {
    if (!user) {
      return;
    }
    setIsAttendeeModalOpen(true);
  }, [user]);

  const handleManageArtist = useCallback(
    (artistId: string) => {
      setIsArtistModalOpen(false);
      navigate('/admin', {
        state: {
          openTab: 'artists',
          editArtistId: artistId,
        },
      });
    },
    [navigate]
  );

  const normalizedRole = useMemo(
    () => (role ? String(role).toLowerCase() : ''),
    [role]
  );

  const canManageArtists = useMemo(
    () => ['admin', 'developer'].includes(normalizedRole),
    [normalizedRole]
  );

  // Main content sections
  const detailsContent = (
    <>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 cascade-item'>
        {/* About This Event */}
        {event.description?.trim() && (
          <FmCommonCollapsibleSection
            title='About This Event'
            defaultExpanded={true}
          >
            <p className='text-muted-foreground leading-relaxed text-sm'>
              {event.description}
            </p>
          </FmCommonCollapsibleSection>
        )}

        {/* Guest List */}
        <GuestListSection
          attendeePreview={attendeePreview}
          ticketCount={ticketCount}
          viewCount={viewCount}
          isLoggedIn={!!user}
          onClick={handleAttendeeCardClick}
          onLoginPrompt={handlePromptLogin}
        />

        {/* Event Information */}
        <EventInformationSection
          longDateLabel={longDateLabel}
          formattedTime={formattedTime}
          isAfterHours={isAfterHours}
          venue={event.venue}
          onVenueClick={handleVenueSelect}
        />

        {/* Call Times */}
        <CallTimesSection
          callTimeLineup={callTimeLineup}
          hasDescription={!!event.description?.trim()}
          onArtistSelect={handleArtistSelect}
        />
      </div>

      <DecorativeDivider marginTop='mt-8' marginBottom='mb-6' />
    </>
  );

  return (
    <>
      <ScrollAreaPrimitive.Root className='relative h-full overflow-hidden'>
        <ScrollAreaPrimitive.Viewport className='h-full w-full'>
          <div className='flex min-h-full flex-col'>
            <ScrollAreaPrimitive.Root className='relative flex-1 overflow-hidden'>
              <ScrollAreaPrimitive.Viewport
                ref={handleContentViewportRef}
                className='h-full w-full'
              >
                <div className='flex min-h-full flex-col'>
                  <div className='flex-1 p-6 lg:p-8'>
                    <div className='mx-auto w-full lg:w-[65%] space-y-8'>
                      <FmDynamicStickyHeader
                        primaryContent={
                          <EventHeader
                            displayTitle={displayTitle}
                            weekdayLabel={weekdayLabel}
                            monthLabel={monthLabel}
                            dayNumber={dayNumber}
                            yearNumber={yearNumber}
                            undercard={event.undercard}
                            longDateLabel={longDateLabel}
                            formattedTime={formattedTime}
                            venue={event.venue}
                            onShare={onShare}
                            onVenueClick={handleVenueSelect}
                            onArtistClick={handleArtistSelect}
                          />
                        }
                        stickyContent={
                          <EventStickyHeader
                            weekdayLabel={weekdayLabel}
                            dayNumber={dayNumber}
                            displayTitle={displayTitle}
                            compactDateLabel={compactDateLabel}
                            formattedTime={formattedTime}
                            venue={event.venue}
                            onShare={onShare}
                            onVenueClick={handleVenueSelect}
                          />
                        }
                        className='pt-4'
                        primaryClassName='group transition-all duration-300'
                        stickyClassName='border border-border/50 bg-background/95 backdrop-blur px-4 py-3 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.7)] transition-shadow duration-300'
                        stickyOffset='calc(4rem + 1.5rem)'
                        scrollContainerRef={contentViewportRef}
                      />

                      <div className='pb-10'>{detailsContent}</div>
                    </div>
                  </div>

                  <FmStickyFooter>
                    <div className='mx-auto w-full lg:w-[65%]'>
                      <FmBigButton onClick={handleOpenCheckout}>
                        Get Tickets
                      </FmBigButton>
                    </div>
                  </FmStickyFooter>
                </div>
              </ScrollAreaPrimitive.Viewport>
              <ScrollBar orientation='vertical' />
            </ScrollAreaPrimitive.Root>
          </div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar orientation='vertical' />
      </ScrollAreaPrimitive.Root>

      {/* Modals */}
      <AttendeeModal
        open={isAttendeeModalOpen}
        onOpenChange={setIsAttendeeModalOpen}
        attendeeList={attendeeList}
      />

      <FmArtistDetailsModal
        artist={selectedArtist}
        open={isArtistModalOpen}
        onOpenChange={handleArtistModalChange}
        canManage={canManageArtists}
        onManage={handleManageArtist}
      />

      <FmVenueDetailsModal
        venue={selectedVenue}
        open={isVenueModalOpen}
        onOpenChange={handleVenueModalChange}
      />
    </>
  );
};
