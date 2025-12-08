import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';

import { Layout } from '@/components/layout/Layout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmDateBox } from '@/components/common/display/FmDateBox';
import { EventCheckoutWizard } from '@/components/ticketing';
import { FmQueueWaitingView } from '@/components/ticketing/queue/FmQueueWaitingView';
import { useEventDetails } from './hooks/useEventDetails';
import { useTicketingGate, QueueEvent } from './hooks/useTicketingGate';
import { useQueueConfiguration } from './hooks/useQueueConfiguration';
import { useCheckoutTimer } from '@/contexts/CheckoutContext';
import { formatTimeDisplay } from '@force-majeure/shared/utils/timeUtils';
import { logger } from '@force-majeure/shared/services/logger';
import { toast } from 'sonner';

export const EventTicketingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading, error } = useEventDetails(id);
  const { data: queueConfig, isLoading: isLoadingConfig } = useQueueConfiguration(id);
  const { startCheckout, endCheckout } = useCheckoutTimer();
  const [hasEntered, setHasEntered] = useState(false);

  // Handle queue events (promotions, position changes)
  const handleQueueEvent = (event: QueueEvent) => {
    switch (event.type) {
      case 'promoted':
        toast.success('Your turn!', {
          description: 'You can now select your tickets.',
        });
        break;
      case 'position_changed':
        if (event.data?.newPosition && event.data.newPosition <= 5) {
          toast.info(`You're almost there!`, {
            description: `Position ${event.data.newPosition} in queue.`,
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
    if (canAccess && id) {
      // Start the checkout timer with redirect to event details on expiration
      startCheckout(`/event/${id}`);
      logger.info('Checkout timer started', { eventId: id });
    }
  }, [canAccess, id, startCheckout]);

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

  const formattedTime = useMemo(
    () => (event?.time ? formatTimeDisplay(event.time) : ''),
    [event?.time]
  );

  const displayTitle = useMemo(
    () => event?.headliner?.name || 'Event',
    [event?.headliner?.name]
  );

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
                ? 'Checking availability...'
                : 'Loading event details...'}
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
              Event not found
            </h1>
            <p className='text-muted-foreground'>
              The event you're looking for doesn't exist or has been removed.
            </p>
            <FmCommonButton onClick={() => navigate('/')} variant='default'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Events
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
            Back to Event
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
            Back to Event
          </FmCommonButton>

          {/* Event Header */}
          <div className='mb-8'>
            <div className='flex items-start gap-[20px] mb-[20px]'>
              <FmDateBox
                weekday={weekdayLabel}
                month={monthLabel}
                day={dayNumber}
                year={yearNumber}
                size='md'
              />
              <div className='flex-1'>
                <h1 className='text-2xl font-canela text-foreground mb-2'>
                  {displayTitle}
                </h1>
                <p className='text-sm text-muted-foreground'>
                  {formattedTime} • {event.venue}
                </p>
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
    </Layout>
  );
};

export default EventTicketingPage;
