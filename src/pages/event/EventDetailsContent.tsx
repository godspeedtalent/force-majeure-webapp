import { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Calendar, Clock, Eye, ExternalLink, Heart, MapPin, Music, Play, Share2, Users } from 'lucide-react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonInfoCard } from '@/components/common/display/FmCommonInfoCard';
import { FmDynamicStickyHeader } from '@/components/common/layout/FmDynamicStickyHeader';
import { ScrollBar } from '@/components/common/shadcn/scroll-area';
import { TicketingPanel } from '@/features/events/components/TicketingPanel';
import EventCheckoutForm from '@/pages/demo/EventCheckoutForm';
import { formatTimeDisplay } from '@/shared/utils/timeUtils';

import { EventDetailsRecord } from './types';

type CheckoutStep = 'selection' | 'checkout';

type TicketSelection = { tierId: string; quantity: number };

type TicketTier = {
  id: string;
  name: string;
  description?: string;
  price: number;
  total_tickets: number;
  available_inventory: number;
  tier_order: number;
  is_active: boolean;
  hide_until_previous_sold_out: boolean;
};

interface EventDetailsContentProps {
  event: EventDetailsRecord;
  onShare: () => void;
  ticketTiers: TicketTier[];
  isTicketTiersLoading: boolean;
  getTotalFees: (subtotal: number) => number;
  displayTitle: string;
  onToggleCheckout?: (isOpen: boolean) => void;
  songsCount: number;
  songsLoading: boolean;
  onPlayLineup: () => void;
  showMusicPlayer: boolean;
}

const ATTENDEE_PLACEHOLDERS = [
  { name: 'Sarah M.', avatar: 'SM' },
  { name: 'James K.', avatar: 'JK' },
  { name: 'Emily R.', avatar: 'ER' },
  { name: 'Alex T.', avatar: 'AT' },
  { name: 'Maya P.', avatar: 'MP' },
];

export const EventDetailsContent = ({
  event,
  onShare,
  ticketTiers,
  isTicketTiersLoading,
  getTotalFees,
  displayTitle,
  onToggleCheckout,
  songsCount,
  songsLoading,
  onPlayLineup,
  showMusicPlayer,
}: EventDetailsContentProps) => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('selection');
  const [ticketSelections, setTicketSelections] = useState<TicketSelection[]>([]);
  const [ticketCount] = useState(() => Math.floor(Math.random() * 100) + 50);
  const [viewCount] = useState(() => Math.floor(Math.random() * 500) + 200);

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
  const undercardNames = useMemo(
    () => event.undercard.map(artist => artist.name).join(' • '),
    [event.undercard]
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

  const handleOpenCheckout = () => {
    setShowCheckout(true);
    setCheckoutStep('selection');
    setTicketSelections([]);
    onToggleCheckout?.(true);
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    setCheckoutStep('selection');
    onToggleCheckout?.(false);
  };

  const orderSummary = useMemo(() => {
    const tickets = ticketSelections.map(selection => {
      const tier = ticketTiers.find(t => t.id === selection.tierId);
      const price = tier?.price ?? 0;
      return {
        name: tier?.name ?? '',
        quantity: selection.quantity,
        price,
      };
    });

    const subtotal = tickets.reduce((total, item) => total + item.price * item.quantity, 0);
    const fees = getTotalFees(subtotal);

    return {
      subtotal,
      fees,
      total: subtotal + fees,
      tickets,
    };
  }, [ticketSelections, ticketTiers, getTotalFees]);

  const detailsContent = (
    <>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 cascade-item'>
        <div className='flex flex-col justify-center'>
          <h3 className='text-lg font-bold mb-3 font-canela'>About This Event</h3>
          <p className='text-muted-foreground leading-relaxed text-sm'>
            {event.description || 'No description available for this event.'}
          </p>
        </div>

        <div>
          <FmCommonCard variant='outline'>
            <h3 className='text-lg font-bold mb-4 font-canela'>Who's Going?</h3>

            <div className='mb-6'>
              <div className='flex items-center gap-3 mb-3'>
                <div className='flex -space-x-2'>
                  {ATTENDEE_PLACEHOLDERS.map((attendee, index) => (
                    <div
                      key={attendee.avatar + index}
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
                    {ticketCount}+ people are going
                  </span>
                </div>
              </div>

              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <Eye className='w-4 h-4' />
                <span>{viewCount.toLocaleString()} views</span>
              </div>
            </div>

            <p className='text-xs text-muted-foreground border-t border-border pt-3'>
              Join the community and see who else is attending
            </p>
          </FmCommonCard>
        </div>
      </div>

      <DecorativeDivider marginTop='mt-8' marginBottom='mb-8' />

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 cascade-item'>
        <div>
          <h3 className='text-lg font-bold mb-4 font-canela'>Event Information</h3>
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
              value={event.venue || 'Venue TBA'}
            />
          </div>
        </div>

        {event.undercard.length > 0 && (
          <div>
            <h3 className='text-lg font-bold mb-4 font-canela'>Schedule</h3>
            <div className='grid gap-2.5'>
              {event.undercard.map((artist, index) => (
                <FmCommonCard
                  key={`${artist.name}-${index}`}
                  variant='outline'
                  size='sm'
                  hoverable
                  className='flex items-center gap-3'
                >
                  <div className='w-10 h-10 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center flex-shrink-0'>
                    <Music className='w-5 h-5 text-muted-foreground' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='font-semibold text-sm truncate'>{artist.name}</h4>
                    <p className='text-xs text-muted-foreground'>{artist.genre}</p>
                  </div>
                </FmCommonCard>
              ))}
            </div>
          </div>
        )}
      </div>

      <DecorativeDivider marginTop='mt-8' marginBottom='mb-6' />

      <div className='flex gap-2.5 justify-center cascade-item'>
        <FmCommonButton
          size='default'
          variant='default'
          icon={ExternalLink}
          iconPosition='right'
          onClick={handleOpenCheckout}
        >
          Get Tickets
        </FmCommonButton>

        {showMusicPlayer && (
          <FmCommonButton
            onClick={onPlayLineup}
            disabled={songsLoading || songsCount === 0}
            size='default'
            variant='secondary'
            icon={Play}
            loading={songsLoading}
          >
            {songsLoading ? 'Loading...' : songsCount > 0 ? `Play (${songsCount})` : 'No Preview'}
          </FmCommonButton>
        )}
      </div>
    </>
  );

  const checkoutContent = (
    <>
      <div className='flex items-center justify-between'>
        <FmCommonButton
          variant='secondary'
          size='sm'
          icon={ArrowLeft}
          onClick={() => {
            if (checkoutStep === 'checkout') {
              setCheckoutStep('selection');
            } else {
              handleCloseCheckout();
            }
          }}
        >
          Back
        </FmCommonButton>
        <h3 className='font-canela text-lg'>Checkout</h3>
      </div>

      {checkoutStep === 'selection' ? (
        <TicketingPanel
          eventId={event.id}
          tiers={ticketTiers}
          isLoading={isTicketTiersLoading}
          onPurchase={(selections) => {
            setTicketSelections(selections);
            setCheckoutStep('checkout');
          }}
        />
      ) : (
        <EventCheckoutForm
          eventId={event.id}
          eventName={displayTitle}
          eventDate={event.date}
          selections={ticketSelections}
          orderSummary={orderSummary}
          onBack={() => setCheckoutStep('selection')}
        />
      )}
    </>
  );

  const headerActions = (
    <div className='flex items-center gap-2'>
      <FmCommonButton
        variant='secondary'
        size='icon'
        icon={Share2}
        onClick={onShare}
        className='border-border/60 text-muted-foreground hover:text-foreground'
      >
        <span className='sr-only'>Share event</span>
      </FmCommonButton>
      <FmCommonButton
        variant='secondary'
        size='icon'
        icon={Heart}
        className='border-border/60 text-muted-foreground hover:text-foreground'
      >
        <span className='sr-only'>Save event</span>
      </FmCommonButton>
    </div>
  );

  const primaryHeader = (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between'>
        <div className='flex items-start gap-4'>
          <div className='w-20 lg:w-24 flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-background/60 px-4 py-4 text-center shadow-[0_15px_35px_-20px_rgba(0,0,0,0.55)]'>
            <span className='text-xs font-semibold tracking-[0.35em] text-muted-foreground/80'>{weekdayLabel}</span>
            <span className='text-xs font-semibold tracking-[0.35em] text-muted-foreground/70 mt-1'>{monthLabel}</span>
            <span className='text-4xl font-bold text-fm-gold leading-none my-2'>{dayNumber}</span>
            <span className='text-xs font-medium text-muted-foreground/80'>{yearNumber}</span>
          </div>
          <div className='space-y-4'>
            <h1 className='text-3xl lg:text-4xl font-canela font-medium text-foreground leading-tight'>
              {displayTitle}
            </h1>
            {undercardNames && (
              <p className='text-sm text-muted-foreground/80'>
                Featuring {undercardNames}
              </p>
            )}
            <div className='flex flex-col gap-2 text-sm text-muted-foreground/90 sm:flex-row sm:flex-wrap sm:items-center'>
              <div className='flex items-center gap-2'>
                <Clock className='h-4 w-4 text-fm-gold flex-shrink-0' />
                <span>{`${longDateLabel} · ${formattedTime}`}</span>
              </div>
              <div className='flex items-center gap-2'>
                <MapPin className='h-4 w-4 text-fm-gold flex-shrink-0' />
                <span>{event.venue || 'Venue TBA'}</span>
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
          <p className='text-xs text-muted-foreground/70 truncate'>{`${compactDateLabel} · ${formattedTime} · ${event.venue}`}</p>
        </div>
      </div>
      {headerActions}
    </div>
  );

  return (
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
                    primaryClassName='rounded-3xl border border-border/40 bg-background/70 backdrop-blur p-6 shadow-[0_18px_48px_-24px_rgba(0,0,0,0.65)]'
                    stickyClassName='rounded-2xl border border-border/60 bg-background/95 backdrop-blur px-4 py-3 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.7)]'
                    stickyOffset='calc(4rem + 1.25rem)'
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
  );
};
