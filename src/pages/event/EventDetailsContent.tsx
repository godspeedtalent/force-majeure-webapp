import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Eye, Heart, MapPin, Share2, Users } from 'lucide-react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmGetTicketsButton } from '@/components/common/buttons/FmGetTicketsButton';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonInfoCard } from '@/components/common/display/FmCommonInfoCard';
import { FmDateBox } from '@/components/common/display/FmDateBox';
import { FmTextLink } from '@/components/common/display/FmTextLink';
import { FmUndercardList } from '@/components/common/display/FmUndercardList';
import { FmDynamicStickyHeader } from '@/components/common/layout/FmDynamicStickyHeader';
import { ScrollBar } from '@/components/common/shadcn/scroll-area';
import { FmCommonStackLayout } from '@/components/common/layout';
import { FmArtistRow, type FmArtistRowProps } from '@/components/artist/FmArtistRow';
import {
  FmArtistDetailsModal,
  type FmArtistDetailsModalProps,
} from '@/components/artist/FmArtistDetailsModal';
import {
  FmVenueDetailsModal,
  type FmVenueDetailsModalProps,
} from '@/components/venue/FmVenueDetailsModal';
import { EventCheckoutWizard } from '@/components/ticketing';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/common/shadcn/dialog';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserRole } from '@/shared/hooks/useUserRole';
import { useEventViews } from '@/shared/hooks/useEventViews';
import { formatTimeDisplay } from '@/shared/utils/timeUtils';

import { EventDetailsRecord } from './types';

interface EventDetailsContentProps {
  event: EventDetailsRecord;
  onShare: () => void;
  displayTitle: string;
  onToggleCheckout?: (isOpen: boolean) => void;
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
  onShare,
  displayTitle,
  onToggleCheckout,
}: EventDetailsContentProps) => {
  const { user } = useAuth();
  const { data: role } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCheckout, setShowCheckout] = useState(false);
  const [ticketCount] = useState(() => Math.floor(Math.random() * 100) + 50);
  const { viewCount, recordView } = useEventViews(event.id);
  const [selectedArtist, setSelectedArtist] = useState<FmArtistDetailsModalProps['artist']>(null);
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<FmVenueDetailsModalProps['venue']>(null);
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [isAttendeeModalOpen, setIsAttendeeModalOpen] = useState(false);

  // Record page view on mount
  useEffect(() => {
    recordView();
  }, [recordView]);

  const contentViewportRef = useRef<HTMLDivElement | null>(null);
  const handleContentViewportRef = useCallback((node: HTMLDivElement | null) => {
    contentViewportRef.current = node;
  }, []);

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
  const formattedTime = useMemo(() => formatTimeDisplay(event.time), [event.time]);
  const weekdayLabel = useMemo(
    () => eventDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    [eventDate]
  );
  const monthLabel = useMemo(
    () => eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    [eventDate]
  );
  const dayNumber = useMemo(() => eventDate.getDate().toString(), [eventDate]);
  const yearNumber = useMemo(() => eventDate.getFullYear(), [eventDate]);
  const callTimeLineup = useMemo(() => {
    const lineup = [...event.undercard, event.headliner].filter(Boolean);
    if (lineup.length === 0) {
      return [];
    }

    const baseDate = new Date(`${event.date}T${event.time || '19:00'}`);
    const hasValidBase = !Number.isNaN(baseDate.getTime());

    return lineup.map((artist, index) => {
      const callDate =
        hasValidBase && index >= 0
          ? new Date(baseDate.getTime() + index * CALL_TIME_INTERVAL_MINUTES * 60_000)
          : null;

      const callTimeLabel =
        callDate !== null
          ? formatTimeDisplay(
              callDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })
            )
          : 'TBD';

      return {
        ...artist,
        callTime: callTimeLabel,
        roleLabel: index === lineup.length - 1 ? 'Headliner' : undefined,
      };
    });
  }, [event.date, event.time, event.headliner, event.undercard]);
  const attendeeList = useMemo(() => {
    const baseAttendees = [...ATTENDEE_PLACEHOLDERS];
    const limit = Math.min(Math.max(ticketCount, baseAttendees.length), 64);
    const extrasNeeded = Math.max(limit - baseAttendees.length, 0);
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    const computeInitials = (value: number) => {
      const first = letters[Math.floor(value / letters.length) % letters.length] ?? 'A';
      const second = letters[value % letters.length] ?? 'A';
      return `${first}${second}`;
    };

    const generated = Array.from({ length: extrasNeeded }, (_unused, index) => ({
      name: `Guest ${index + 1}`,
      avatar: computeInitials(index),
    }));

    return baseAttendees.concat(generated);
  }, [ticketCount]);
  const attendeePreview = useMemo(
    () => attendeeList.slice(0, ATTENDEE_PLACEHOLDERS.length),
    [attendeeList]
  );

  const handleOpenCheckout = () => {
    setShowCheckout(true);
    onToggleCheckout?.(true);
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    onToggleCheckout?.(false);
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
      // Additional venue details could be fetched here
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

  const normalizedRole = useMemo(
    () => (role ? String(role).toLowerCase() : ''),
    [role]
  );

  const canManageArtists = useMemo(
    () => ['admin', 'developer'].includes(normalizedRole),
    [normalizedRole]
  );

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

  const detailsContent = (
    <>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 cascade-item'>
        <div className='flex flex-col justify-center'>
          <h3 className='text-lg mb-3 font-canela'>About This Event</h3>
          <p className='text-muted-foreground leading-relaxed text-sm'>
            {event.description || 'No description available for this event.'}
          </p>
        </div>

        <div>
          <FmCommonCard
            variant='outline'
            onClick={user ? handleAttendeeCardClick : undefined}
            className='relative overflow-hidden'
          >
            <h3 className='text-lg mb-4 font-canela'>Who's Going?</h3>

            <div className='flex items-center gap-3 mb-4'>
              <div className='flex -space-x-2'>
                {attendeePreview.map((attendee, index) => (
                  <div
                    key={`${attendee.avatar}-${index}`}
                    className='w-8 h-8 rounded-full bg-gradient-to-br from-fm-gold/20 to-fm-gold/40 border-2 border-card flex items-center justify-center'
                    title={attendee.name}
                  >
                    <span className='text-[10px] font-semibold text-fm-gold'>
                      {attendee.avatar}
                    </span>
                  </div>
                ))}
              </div>
              <div className='flex items-center gap-2'>
                <Users className='w-4 h-4 text-fm-gold' />
                <span className='font-semibold text-sm'>
                  + {ticketCount.toLocaleString()} others
                </span>
              </div>
            </div>

            <div className='mt-4 border-t border-border pt-3'>
              <div className='flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground'>
                {user ? (
                  <span className='font-semibold text-fm-gold'>Click for full list</span>
                ) : (
                  <button
                    type='button'
                    onClick={event => {
                      event.stopPropagation();
                      handlePromptLogin();
                    }}
                    className='text-xs font-semibold text-fm-gold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-fm-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                  >
                    Log in to see the full list
                  </button>
                )}
                <div className='flex items-center gap-2'>
                  <Eye className='w-4 h-4' />
                  <span>{viewCount.toLocaleString()} page views</span>
                </div>
              </div>
            </div>
          </FmCommonCard>
        </div>
      </div>

      <DecorativeDivider marginTop='mt-8' marginBottom='mb-8' />

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 cascade-item'>
        <div>
          <h3 className='text-lg mb-4 font-canela'>Event Information</h3>
          <div className='grid gap-4'>
            <FmCommonInfoCard
              icon={Calendar}
              label='Date & Time'
              size='sm'
              value={`${longDateLabel} @ ${formattedTime}`}
            />

            <FmCommonInfoCard
              icon={MapPin}
              label='Venue'
              size='sm'
              value={
                <FmTextLink onClick={handleVenueSelect}>
                  {event.venue || 'Venue TBA'}
                </FmTextLink>
              }
            />
          </div>
        </div>

        {callTimeLineup.length > 0 && (
          <div>
            <h3 className='text-lg mb-4 font-canela'>Call times</h3>
            <FmCommonStackLayout spacing='md'>
              {callTimeLineup.map((artist, index) => (
                <FmArtistRow
                  key={`${artist.name}-${index}`}
                  artist={artist}
                  onSelect={handleArtistSelect}
                />
              ))}
            </FmCommonStackLayout>
          </div>
        )}
      </div>

      <DecorativeDivider marginTop='mt-8' marginBottom='mb-6' />

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center cascade-item'>
        <FmGetTicketsButton
          onClick={handleOpenCheckout}
        >
          Get Tickets
        </FmGetTicketsButton>
      </div>
    </>
  );

  const checkoutContent = (
    <EventCheckoutWizard event={event} displayTitle={displayTitle} onClose={handleCloseCheckout} />
  );

  const headerActions = (
    <div className='flex items-center gap-2'>
      <FmCommonButton
        aria-label='Share event'
        variant='secondary'
        size='icon'
        onClick={onShare}
        className='bg-white/5 text-muted-foreground transition-colors duration-200 hover:bg-white/10 hover:text-foreground'
      >
        <Share2 className='h-4 w-4' />
      </FmCommonButton>
      <FmCommonButton
        aria-label='Save event'
        variant='secondary'
        size='icon'
        className='bg-white/5 text-muted-foreground transition-colors duration-200 hover:bg-white/10 hover:text-foreground'
      >
        <Heart className='h-4 w-4' />
      </FmCommonButton>
    </div>
  );

  const primaryHeader = (
    <div className='flex flex-col gap-5'>
      <div className='flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex flex-wrap items-center gap-4 lg:flex-nowrap'>
          <FmDateBox
            weekday={weekdayLabel}
            month={monthLabel}
            day={dayNumber}
            year={yearNumber}
            size="lg"
          />
          <div className='space-y-3'>
            <h1 className='text-3xl lg:text-4xl font-canela font-medium text-foreground leading-tight'>
              {displayTitle}
            </h1>
            <FmUndercardList
              artists={event.undercard}
              onArtistClick={(artist) =>
                handleArtistSelect({
                  id: artist.id ?? undefined,
                  name: artist.name,
                  genre: artist.genre,
                  image: artist.image,
                })
              }
            />
            <div className='flex flex-col gap-1.5 text-sm text-muted-foreground/90 sm:flex-row sm:flex-wrap sm:items-center'>
              <div className='flex items-center gap-2'>
                <Clock className='h-4 w-4 text-fm-gold flex-shrink-0' />
                <span>{`${longDateLabel} ${BULLET_SEPARATOR} ${formattedTime}`}</span>
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
    </div>
  );

  const stickyHeader = (
    <div className='flex items-center justify-between gap-3'>
      <div className='flex items-center gap-3 min-w-0'>
        <div className='flex flex-col items-center justify-center rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-[10px] font-semibold tracking-[0.35em] text-muted-foreground/80'>
          <span>{weekdayLabel}</span>
          <span>{dayNumber}</span>
        </div>
        <div className='min-w-0'>
          <h3 className='text-sm font-semibold text-foreground truncate'>{displayTitle}</h3>
          <p className='text-xs text-muted-foreground/70 truncate'>{`${compactDateLabel} ${BULLET_SEPARATOR} ${formattedTime} ${BULLET_SEPARATOR} ${event.venue}`}</p>
        </div>
      </div>
      {headerActions}
    </div>
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
                <div className='flex min-h-full flex-col p-6 lg:p-8'>
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

                    <div className='pb-10'>
                      {showCheckout ? checkoutContent : detailsContent}
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

      <Dialog open={isAttendeeModalOpen} onOpenChange={setIsAttendeeModalOpen}>
        <DialogContent className='max-w-md bg-background/95 backdrop-blur border border-border/60 max-h-[85vh] flex flex-col'>
          <DialogHeader className='flex-shrink-0'>
            <DialogTitle className='font-canela text-lg'>Guest list</DialogTitle>
          </DialogHeader>
          
          {/* Public Users Section */}
          <div className='grid max-h-[500px] grid-cols-4 gap-3 overflow-y-auto pr-1 flex-1'>
            {attendeeList.slice(0, ATTENDEE_PLACEHOLDERS.length).map((attendee, index) => (
              <div
                key={`${attendee.avatar}-${index}`}
                className='flex flex-col items-center gap-2 text-center group cursor-pointer'
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
          
          {/* Private Users Section */}
          {attendeeList.length > ATTENDEE_PLACEHOLDERS.length && (
            <>
              <DecorativeDivider 
                marginTop='mt-4' 
                marginBottom='mb-4' 
                lineWidth='w-8' 
                opacity={0.5} 
              />
              <div className='flex-shrink-0'>
                <div className='flex items-center justify-between mb-3'>
                  <h4 className='text-sm font-medium text-foreground'>Guests are private users</h4>
                  <span className='text-xs text-muted-foreground/70'>
                    +{(attendeeList.length - ATTENDEE_PLACEHOLDERS.length - 4).toLocaleString()} more
                  </span>
                </div>
                <div className='grid grid-cols-4 gap-3 mb-4'>
                  {attendeeList.slice(ATTENDEE_PLACEHOLDERS.length, ATTENDEE_PLACEHOLDERS.length + 4).map((attendee, index) => (
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
              </div>
            </>
          )}
          
          {/* Interested Section */}
          <DecorativeDivider 
            marginTop='mt-2' 
            marginBottom='mb-4' 
            lineWidth='w-8' 
            opacity={0.5} 
          />
          <div className='flex-shrink-0'>
            <div className='flex items-center justify-between mb-3'>
              <h4 className='text-sm font-medium text-foreground'>Interested</h4>
              {attendeeList.length > 8 && (
                <span className='text-xs text-muted-foreground/70'>
                  +{Math.max(0, attendeeList.length - 8).toLocaleString()} more
                </span>
              )}
            </div>
            <div className='grid grid-cols-4 gap-3'>
              {attendeeList.slice(0, 8).map((attendee, index) => (
                <div
                  key={`interested-${attendee.avatar}-${index}`}
                  className='flex flex-col items-center gap-2 text-center'
                >
                  <div className='flex h-12 w-12 items-center justify-center rounded-full border border-border bg-gradient-to-br from-muted-foreground/15 to-muted-foreground/35 text-xs font-semibold uppercase text-muted-foreground'>
                    {attendee.avatar}
                  </div>
                  <span className='w-full truncate text-[11px] leading-tight text-muted-foreground'>
                    {attendee.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
