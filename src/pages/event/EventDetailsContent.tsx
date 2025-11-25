import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Eye,
  Heart,
  MapPin,
  Share2,
  Users,
} from 'lucide-react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { TIME_CONSTANTS } from '@/shared/constants/timeConstants';

import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmBigButton } from '@/components/common/buttons/FmBigButton';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonInfoCard } from '@/components/common/display/FmCommonInfoCard';
import { FmDateBox } from '@/components/common/display/FmDateBox';
import { FmTextLink } from '@/components/common/display/FmTextLink';
import { FmUndercardList } from '@/components/common/display/FmUndercardList';
import { FmDynamicStickyHeader } from '@/components/common/layout/FmDynamicStickyHeader';
import { ScrollBar } from '@/components/common/shadcn/scroll-area';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import {
  FmCommonStackLayout,
} from '@/components/common/layout';
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import {
  FmArtistRow,
  type FmArtistRowProps,
} from '@/components/artist/FmArtistRow';
import {
  FmArtistDetailsModal,
  type FmArtistDetailsModalProps,
} from '@/components/artist/FmArtistDetailsModal';
import {
  FmVenueDetailsModal,
  type FmVenueDetailsModalProps,
} from '@/components/venue/FmVenueDetailsModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { Badge } from '@/components/common/shadcn/badge';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserRole } from '@/shared/hooks/useUserRole';
import { useEventViews } from '@/shared/hooks/useEventViews';
import { formatTimeDisplay } from '@/shared/utils/timeUtils';
import { supabase } from '@/shared/api/supabase/client';
import { useQuery } from '@tanstack/react-query';

import { EventDetailsRecord } from './types';

interface EventDetailsContentProps {
  event: EventDetailsRecord;
  onShare: () => void;
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
  onShare,
  displayTitle,
}: EventDetailsContentProps) => {
  const { user } = useAuth();
  const { data: role } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [ticketCount] = useState(() => Math.floor(Math.random() * 100) + 50);
  const { viewCount, recordView } = useEventViews(event.id);
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
        .from('feature_flags' as any)
        .select('is_enabled, environment_id, environments!inner(name)')
        .eq('flag_name', 'guest_list')
        .eq('environments.name', 'production')
        .maybeSingle();

      if (!(flagData as any)?.is_enabled) return false;

      // Check event settings
      const { data: settingsData } = await supabase
        .from('guest_list_settings' as any)
        .select('*')
        .eq('event_id', event.id)
        .maybeSingle();

      // Guest list is enabled if:
      // - Feature flag is on
      // - Event has settings enabled
      // - At least one threshold is met (for now we'll show if enabled)
      return (settingsData as any)?.is_enabled ?? false;
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

  // Display subtitle as venue
  const displaySubtitle = event?.venue || '';

  // Format time as: 9pm - 2am PST (just the time, no date)
  const formattedDateTime = useMemo(() => {
    // Parse start time
    const startMatch = event.time?.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!startMatch) return '';
    
    let startHours = parseInt(startMatch[1], 10);
    const startMeridiem = startMatch[3]?.toUpperCase() || 'PM';
    
    // Assume end time is 5 hours later (placeholder logic)
    const startDate = new Date(`${event.date}T${startHours.toString().padStart(2, '0')}:${startMatch[2]}:00`);
    const endDate = new Date(startDate.getTime() + 5 * 60 * 60 * 1000);
    let endHours = endDate.getHours();
    const endMeridiem = endHours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    if (startMeridiem === 'PM' && startHours !== 12) startHours += 12;
    if (startMeridiem === 'AM' && startHours === 12) startHours = 0;
    
    const startDisplay = startHours > 12 ? startHours - 12 : (startHours === 0 ? 12 : startHours);
    const endDisplay = endHours > 12 ? endHours - 12 : (endHours === 0 ? 12 : endHours);
    
    // Only show first meridiem if different from second
    const startMeridiemDisplay = startMeridiem !== endMeridiem ? startMeridiem.toLowerCase() : '';
    const endMeridiemDisplay = endMeridiem.toLowerCase();
    
    // Get timezone
    const timezone = new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ')[2];
    
    return `${startDisplay}${startMeridiemDisplay} - ${endDisplay}${endMeridiemDisplay} ${timezone}`;
  }, [event.date, event.time]);

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
  const isAfterHours = useMemo(() => {
    if (!event.time) return false;
    const timeParts = event.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!timeParts) return false;

    let hours = parseInt(timeParts[1], 10);
    const meridiem = timeParts[3]?.toUpperCase();

    if (meridiem === 'PM' && hours !== TIME_CONSTANTS.NOON_HOUR) hours += TIME_CONSTANTS.NOON_HOUR;
    if (meridiem === 'AM' && hours === TIME_CONSTANTS.NOON_HOUR) hours = TIME_CONSTANTS.MIDNIGHT_HOUR;

    // After hours: 10 PM or later, or before 6 AM
    return hours >= TIME_CONSTANTS.AFTER_HOURS_START || hours < TIME_CONSTANTS.EARLY_MORNING_END;
  }, [event.time]);
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
    const lineup = [...event.undercard, event.headliner].filter(Boolean);
    if (lineup.length === 0) {
      return [];
    }

    const baseDate = new Date(`${event.date}T${event.time || '19:00'}`);
    const hasValidBase = !Number.isNaN(baseDate.getTime());

    return lineup.map((artist, index) => {
      const callDate =
        hasValidBase && index >= 0
          ? new Date(
              baseDate.getTime() + index * CALL_TIME_INTERVAL_MINUTES * 60_000
            )
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
      {/* Unified grid - items flow to fill gaps */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 cascade-item'>
        {/* About This Event - only shows if description exists */}
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

        {/* Guest List - conditionally shows based on feature flag and event settings */}
        {guestListEnabled && (
          <FmCommonCard
            variant='outline'
            onClick={user ? handleAttendeeCardClick : undefined}
            className='relative overflow-hidden'
          >
          <h3 className='text-lg mb-4 font-canela'>Guest list</h3>

          <div className='flex items-center gap-3 mb-4'>
            <div className='flex -space-x-2'>
              {attendeePreview.map((attendee, index) => (
                <div
                  key={`${attendee.avatar}-${index}`}
                  className='w-8 h-8 rounded-full bg-gradient-to-br from-fm-gold/20 to-fm-gold/40 border-2 border-card flex items-center justify-center transition-all duration-200 hover:scale-110 hover:border-fm-gold cursor-pointer'
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
              <span className='text-xs font-normal text-muted-foreground'>
                + {ticketCount.toLocaleString()} others
              </span>
            </div>
          </div>

          <div className='mt-4 border-t border-border pt-3'>
            <div className='flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground'>
              {user ? (
                <span className='font-normal text-muted-foreground'>
                  Click to see full list
                </span>
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
              {showViewCount && (
                <div className='flex items-center gap-2'>
                  <Eye className='w-4 h-4' />
                  <span>{viewCount.toLocaleString()} page views</span>
                </div>
              )}
            </div>
          </div>
        </FmCommonCard>
        )}

        {/* Event Information - always shows */}
        <FmCommonCollapsibleSection
          title='Event Information'
          defaultExpanded={true}
          className={!guestListEnabled ? 'lg:col-span-2' : ''}
        >
          <div className='grid gap-4'>
            <FmCommonInfoCard
              icon={Calendar}
              label='Date & Time'
              size='sm'
              value={
                <div className='flex flex-col gap-1.5'>
                  <div>{longDateLabel}</div>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <Clock className='w-3 h-3' />
                    <span>{formattedTime}</span>
                    {isAfterHours && (
                      <Badge className='bg-fm-gold/20 text-fm-gold border-fm-gold/40 text-[10px] px-1.5 py-0'>
                        After Hours
                      </Badge>
                    )}
                  </div>
                </div>
              }
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
        </FmCommonCollapsibleSection>

        {/* Call Times - only shows if lineup exists, spans full width if it's the 4th item */}
        {callTimeLineup.length > 0 && (
          <FmCommonCollapsibleSection
            title='Call times'
            defaultExpanded={true}
            className={!event.description?.trim() ? 'lg:col-span-2' : ''}
          >
            {/* Use vertical stack layout when taking full width, row format in column */}
            <FmCommonStackLayout spacing='md'>
              {callTimeLineup.map((artist, index) => (
                <FmArtistRow
                  key={`${artist.name}-${index}`}
                  artist={artist}
                  onSelect={handleArtistSelect}
                />
              ))}
            </FmCommonStackLayout>
          </FmCommonCollapsibleSection>
        )}
      </div>

      <DecorativeDivider marginTop='mt-8' marginBottom='mb-6' />
    </>
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
      {/* Show view count here if guest list is disabled but view count is enabled */}
      {!guestListEnabled && showViewCount && (
        <div className='flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg'>
          <Eye className='w-4 h-4 text-muted-foreground' />
          <span className='text-sm text-muted-foreground'>{viewCount.toLocaleString()}</span>
        </div>
      )}
    </div>
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
        <div className='absolute inset-0 pointer-events-none overflow-hidden'>
          <TopographicBackground opacity={0.35} parallax={false} />
          <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
        </div>

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
