import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertCircle, MapPin, Clock, Moon } from 'lucide-react';

import { Layout } from '@/components/layout/Layout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmDateBox } from '@/components/common/display/FmDateBox';
import { FmTextLink } from '@/components/common/display/FmTextLink';
import { FmUndercardList } from '@/components/common/display/FmUndercardList';
import { Badge } from '@/components/common/shadcn/badge';
import { FmVenueDetailsModal } from '@/components/venue/FmVenueDetailsModal';
import { EventCheckoutWizard } from '@/components/ticketing';
import { FmQueueWaitingView } from '@/components/ticketing/queue/FmQueueWaitingView';
import { useEventDetails } from './hooks/useEventDetails';
import { useTicketingGate, QueueEvent } from './hooks/useTicketingGate';
import { useQueueConfiguration } from './hooks/useQueueConfiguration';
import { useCheckoutTimer } from '@/contexts/CheckoutContext';
import { useCheckoutTimerDuration } from '@/hooks/useAppSettings';
import { logger } from '@/shared';
import { toast } from 'sonner';

export const EventTicketingPage = () => {
  const { t } = useTranslation('pages');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading, error } = useEventDetails(id);
  const { data: queueConfig, isLoading: isLoadingConfig } = useQueueConfiguration(id);
  const { startCheckout, endCheckout } = useCheckoutTimer();
  // Fetch checkout timer duration (uses per-event config or global default)
  const { data: checkoutDuration } = useCheckoutTimerDuration(id);
  const [hasEntered, setHasEntered] = useState(false);
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);

  // Handle queue events (promotions, position changes)
  const handleQueueEvent = (queueEvent: QueueEvent) => {
    switch (queueEvent.type) {
      case 'promoted':
        toast.success(t('ticketing.yourTurn'), {
          description: t('ticketing.canSelectTickets'),
        });
        break;
      case 'position_changed':
        if (queueEvent.data?.newPosition && queueEvent.data.newPosition <= 5) {
          toast.info(t('ticketing.almostThere'), {
            description: t('ticketing.positionInQueue', {
              position: queueEvent.data.newPosition,
            }),
          });
        }
        break;
      default:
        break;
    }
  };

  const {
    canAccess,
    queuePosition,
    waitingCount,
    activeCount,
    estimatedWaitMinutes,
    enterGate,
    exitGate,
    isChecking,
  } = useTicketingGate(id || '', {
    maxConcurrent: queueConfig?.max_concurrent_users ?? 50,
    sessionTimeoutMinutes: queueConfig?.session_timeout_minutes ?? 30,
    onQueueEvent: handleQueueEvent,
    useRealtime: true,
  });

  // Attempt to enter the gate when the page loads
  useEffect(() => {
    if (!id || hasEntered) return;

    const attemptEntry = async () => {
      try {
        logger.info('Attempting to enter ticketing gate', { eventId: id });
        const entered = await enterGate();
        if (entered) {
          setHasEntered(true);
          logger.info('Successfully entered ticketing gate', { eventId: id });
        } else {
          logger.info('Entered queue but waiting for access', { eventId: id });
        }
      } catch (err) {
        logger.error('Failed to enter ticketing gate', { error: err });
      }
    };

    attemptEntry();
  }, [id, enterGate, hasEntered]);

  // Start checkout timer when user gains access
  useEffect(() => {
    if (canAccess && id && checkoutDuration) {
      // Start the checkout timer with redirect to event details on expiration
      // Pass the duration in seconds from the configuration
      startCheckout(`/event/${id}`, checkoutDuration);
      logger.info('Checkout timer started', { eventId: id, durationSeconds: checkoutDuration });
    }
  }, [canAccess, id, startCheckout, checkoutDuration]);

  // Clean up on unmount - exit the gate and end checkout
  useEffect(() => {
    return () => {
      if (hasEntered && id) {
        exitGate();
        endCheckout();
        logger.info('Exited ticketing gate and ended checkout', { eventId: id });
      }
    };
  }, [hasEntered, id, exitGate, endCheckout]);

  const eventDate = useMemo(
    () => (event?.date ? new Date(event.date) : null),
    [event?.date]
  );

  const weekdayLabel = useMemo(
    () =>
      eventDate
        ?.toLocaleDateString('en-US', { weekday: 'short' })
        .toUpperCase() ?? '',
    [eventDate]
  );

  const monthLabel = useMemo(
    () =>
      eventDate
        ?.toLocaleDateString('en-US', { month: 'short' })
        .toUpperCase() ?? '',
    [eventDate]
  );

  const dayNumber = useMemo(
    () => eventDate?.getDate().toString() ?? '',
    [eventDate]
  );

  const yearNumber = useMemo(() => eventDate?.getFullYear() ?? 0, [eventDate]);

  // Compute displayTitle - prefer headliner name, fallback to event title
  // If noHeadliner is true or headliner name is 'TBA', use the event title instead
  const displayTitle = useMemo(() => {
    if (event?.noHeadliner || event?.headliner?.name === 'TBA') {
      return event?.title || 'Event';
    }
    return event?.headliner?.name || event?.title || 'Event';
  }, [event?.headliner?.name, event?.title, event?.noHeadliner]);

  // Display subtitle from event data, fallback to venue if no subtitle
  const displaySubtitle = useMemo(
    () => event?.subtitle || '',
    [event?.subtitle]
  );

  // Format time as: 9pm - 2am or 9pm - Late for after hours
  const formattedDateTime = useMemo(() => {
    if (!event?.time) return '';

    const startMatch = event.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!startMatch) return event.time;

    const startHour = parseInt(startMatch[1], 10);
    const startMeridiem = (startMatch[3] || 'PM').toUpperCase();

    // If after hours, show "9pm - Late"
    if (event.isAfterHours) {
      return `${startHour}${startMeridiem.toLowerCase()} - Late`;
    }

    // If no end time, just show start time
    if (!event.endTime) {
      return `${startHour}${startMeridiem.toLowerCase()}`;
    }

    // Parse end time
    const endMatch = event.endTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!endMatch) {
      return `${startHour}${startMeridiem.toLowerCase()}`;
    }

    const endHour = parseInt(endMatch[1], 10);
    const endMeridiem = (endMatch[3] || 'AM').toUpperCase();

    // Only show first meridiem if different from second
    const startMeridiemDisplay =
      startMeridiem !== endMeridiem ? startMeridiem.toLowerCase() : '';
    const endMeridiemDisplay = endMeridiem.toLowerCase();

    return `${startHour}${startMeridiemDisplay} - ${endHour}${endMeridiemDisplay}`;
  }, [event?.time, event?.endTime, event?.isAfterHours]);

  // Handler for venue modal
  const handleVenueSelect = () => {
    setIsVenueModalOpen(true);
  };

  const handleBack = () => {
    if (id) {
      navigate(`/event/${id}`);
    } else {
      navigate('/');
    }
  };

  const handleCheckoutClose = () => {
    // Exit the gate when checkout is complete/closed
    if (id) {
      exitGate();
      endCheckout();
      logger.info('Checkout closed, exited gate', { eventId: id });
    }
    // Navigate back to event details
    handleBack();
  };

  // Loading state
  if (isLoading || isLoadingConfig || isChecking) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[600px]'>
          <div className='flex flex-col items-center gap-6'>
            <div className='animate-spin rounded-none h-16 w-16 border-b-4 border-fm-gold' />
            <p className='text-foreground text-lg font-medium font-canela'>
              {isChecking
                ? t('ticketing.checkingAvailability')
                : t('ticketing.loadingEventDetails')}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error || !event || !id) {
    return (
      <Layout>
        <div className='container mx-auto py-12 px-[20px]'>
          <div className='max-w-2xl mx-auto text-center space-y-6'>
            <AlertCircle className='h-16 w-16 text-fm-danger mx-auto' />
            <h1 className='text-3xl font-canela text-foreground'>
              {t('ticketing.eventNotFound')}
            </h1>
            <p className='text-muted-foreground'>
              {t('ticketing.eventNotFoundDescription')}
            </p>
            <FmCommonButton onClick={() => navigate('/')} variant='default'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              {t('ticketing.backToEvents')}
            </FmCommonButton>
          </div>
        </div>
      </Layout>
    );
  }

  // Queue/waiting state - user cannot access ticketing yet
  if (!canAccess && queuePosition !== null && queueConfig) {
    return (
      <Layout>
        <div className='container mx-auto py-[20px] px-[20px]'>
          {/* Back button */}
          <FmCommonButton
            onClick={handleBack}
            variant='secondary'
            size='sm'
            icon={ArrowLeft}
            className='mb-[20px]'
          >
            {t('ticketing.backToEvent')}
          </FmCommonButton>

          {/* Queue waiting view */}
          <FmQueueWaitingView
            event={event as any}
            queuePosition={queuePosition}
            totalWaiting={waitingCount}
            activeCount={activeCount}
            maxConcurrent={queueConfig.max_concurrent_users}
            estimatedWaitMinutes={estimatedWaitMinutes}
            checkoutTimeoutMinutes={queueConfig.checkout_timeout_minutes}
          />
        </div>
      </Layout>
    );
  }

  // Main ticketing content - user has access
  return (
    <Layout>
      <div className='container mx-auto py-12 px-[20px]'>
        <div className='max-w-4xl mx-auto'>
          {/* Back button */}
          <FmCommonButton
            onClick={handleBack}
            variant='secondary'
            size='sm'
            icon={ArrowLeft}
            className='mb-[20px]'
          >
            {t('ticketing.backToEvent')}
          </FmCommonButton>

          {/* Event Header - Rich display matching event details page */}
          <div className='mb-8'>
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
                  onArtistClick={() => {}}
                />
                <div className='flex flex-col gap-1.5 text-sm text-muted-foreground/90 tracking-wide'>
                  <div className='flex items-center gap-2'>
                    <MapPin className='h-4 w-4 text-fm-gold flex-shrink-0' />
                    <FmTextLink onClick={handleVenueSelect}>
                      {event.venue || t('ticketing.venueTba')}
                    </FmTextLink>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Clock className='h-4 w-4 text-fm-gold flex-shrink-0' />
                    <span>{formattedDateTime}</span>
                  </div>
                  {event.isAfterHours && (
                    <Badge className='w-fit bg-fm-gold/20 text-fm-gold border-fm-gold/40 text-[10px] px-2 py-0.5 flex items-center gap-1.5'>
                      <Moon className='h-3 w-3' />
                      {t('ticketing.afterHoursEvent')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Wizard */}
          <EventCheckoutWizard
            event={event}
            displayTitle={displayTitle}
            onClose={handleCheckoutClose}
          />
        </div>
      </div>

      {/* Venue Details Modal */}
      <FmVenueDetailsModal
        venue={
          event.venueDetails
            ? {
                id: event.venueDetails.id,
                name: event.venue,
                description: event.venueDetails.description ?? undefined,
                address: event.venueDetails.address ?? undefined,
                city: event.venueDetails.city ?? undefined,
                state: event.venueDetails.state ?? undefined,
                zipCode: event.venueDetails.zipCode ?? undefined,
                image: event.venueDetails.image,
                logo: event.venueDetails.logo,
                website: event.venueDetails.website,
                googleMapsUrl: event.venueDetails.googleMapsUrl,
                instagram: event.venueDetails.instagram,
                facebook: event.venueDetails.facebook,
                youtube: event.venueDetails.youtube,
                tiktok: event.venueDetails.tiktok,
              }
            : null
        }
        open={isVenueModalOpen}
        onOpenChange={setIsVenueModalOpen}
      />
    </Layout>
  );
};

export default EventTicketingPage;
