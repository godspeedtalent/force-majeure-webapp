import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmDateBox } from '@/components/common/display/FmDateBox';
import { EventCheckoutWizard } from '@/components/ticketing';
import { FmQueueWaitingView } from '@/components/ticketing/queue/FmQueueWaitingView';
import { useEventDetails } from './hooks/useEventDetails';
import { useTicketingGate } from './hooks/useTicketingGate';
import { useQueueConfiguration } from './hooks/useQueueConfiguration';
import { useCheckoutTimer } from '@/contexts/CheckoutContext';
import { useCheckoutTimerDuration } from '@/hooks/useAppSettings';
import { formatTimeDisplay } from '@/shared';
import { logger } from '@/shared';
import { toast } from 'sonner';
export const EventTicketingPage = () => {
    const { t } = useTranslation('pages');
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: event, isLoading, error } = useEventDetails(id);
    const { data: queueConfig, isLoading: isLoadingConfig } = useQueueConfiguration(id);
    const { startCheckout, endCheckout } = useCheckoutTimer();
    // Fetch checkout timer duration (uses per-event config or global default)
    const { data: checkoutDuration } = useCheckoutTimerDuration(id);
    const [hasEntered, setHasEntered] = useState(false);
    // Handle queue events (promotions, position changes)
    const handleQueueEvent = (queueEvent) => {
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
    const { canAccess, queuePosition, waitingCount, activeCount, estimatedWaitMinutes, enterGate, exitGate, isChecking, } = useTicketingGate(id || '', {
        maxConcurrent: queueConfig?.max_concurrent_users ?? 50,
        sessionTimeoutMinutes: queueConfig?.session_timeout_minutes ?? 30,
        onQueueEvent: handleQueueEvent,
        useRealtime: true,
    });
    // Attempt to enter the gate when the page loads
    useEffect(() => {
        if (!id || hasEntered)
            return;
        const attemptEntry = async () => {
            try {
                logger.info('Attempting to enter ticketing gate', { eventId: id });
                const entered = await enterGate();
                if (entered) {
                    setHasEntered(true);
                    logger.info('Successfully entered ticketing gate', { eventId: id });
                }
                else {
                    logger.info('Entered queue but waiting for access', { eventId: id });
                }
            }
            catch (err) {
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
    const eventDate = useMemo(() => (event?.date ? new Date(event.date) : null), [event?.date]);
    const weekdayLabel = useMemo(() => eventDate
        ?.toLocaleDateString('en-US', { weekday: 'short' })
        .toUpperCase() ?? '', [eventDate]);
    const monthLabel = useMemo(() => eventDate
        ?.toLocaleDateString('en-US', { month: 'short' })
        .toUpperCase() ?? '', [eventDate]);
    const dayNumber = useMemo(() => eventDate?.getDate().toString() ?? '', [eventDate]);
    const yearNumber = useMemo(() => eventDate?.getFullYear() ?? 0, [eventDate]);
    const formattedTime = useMemo(() => (event?.time ? formatTimeDisplay(event.time) : ''), [event?.time]);
    const displayTitle = useMemo(() => event?.headliner?.name || 'Event', [event?.headliner?.name]);
    const handleBack = () => {
        if (id) {
            navigate(`/event/${id}`);
        }
        else {
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
        return (_jsx(Layout, { children: _jsx("div", { className: 'flex items-center justify-center min-h-[600px]', children: _jsxs("div", { className: 'flex flex-col items-center gap-6', children: [_jsx("div", { className: 'animate-spin rounded-none h-16 w-16 border-b-4 border-fm-gold' }), _jsx("p", { className: 'text-foreground text-lg font-medium font-canela', children: isChecking
                                ? t('ticketing.checkingAvailability')
                                : t('ticketing.loadingEventDetails') })] }) }) }));
    }
    // Error state
    if (error || !event || !id) {
        return (_jsx(Layout, { children: _jsx("div", { className: 'container mx-auto py-12 px-[20px]', children: _jsxs("div", { className: 'max-w-2xl mx-auto text-center space-y-6', children: [_jsx(AlertCircle, { className: 'h-16 w-16 text-fm-danger mx-auto' }), _jsx("h1", { className: 'text-3xl font-canela text-foreground', children: t('ticketing.eventNotFound') }), _jsx("p", { className: 'text-muted-foreground', children: t('ticketing.eventNotFoundDescription') }), _jsxs(FmCommonButton, { onClick: () => navigate('/'), variant: 'default', children: [_jsx(ArrowLeft, { className: 'mr-2 h-4 w-4' }), t('ticketing.backToEvents')] })] }) }) }));
    }
    // Queue/waiting state - user cannot access ticketing yet
    if (!canAccess && queuePosition !== null && queueConfig) {
        return (_jsx(Layout, { children: _jsxs("div", { className: 'container mx-auto py-[20px] px-[20px]', children: [_jsx(FmCommonButton, { onClick: handleBack, variant: 'secondary', size: 'sm', icon: ArrowLeft, className: 'mb-[20px]', children: t('ticketing.backToEvent') }), _jsx(FmQueueWaitingView, { event: event, queuePosition: queuePosition, totalWaiting: waitingCount, activeCount: activeCount, maxConcurrent: queueConfig.max_concurrent_users, estimatedWaitMinutes: estimatedWaitMinutes, checkoutTimeoutMinutes: queueConfig.checkout_timeout_minutes })] }) }));
    }
    // Main ticketing content - user has access
    return (_jsx(Layout, { children: _jsx("div", { className: 'container mx-auto py-12 px-[20px]', children: _jsxs("div", { className: 'max-w-4xl mx-auto', children: [_jsx(FmCommonButton, { onClick: handleBack, variant: 'secondary', size: 'sm', icon: ArrowLeft, className: 'mb-[20px]', children: t('ticketing.backToEvent') }), _jsx("div", { className: 'mb-8', children: _jsxs("div", { className: 'flex items-start gap-[20px] mb-[20px]', children: [_jsx(FmDateBox, { weekday: weekdayLabel, month: monthLabel, day: dayNumber, year: yearNumber, size: 'md' }), _jsxs("div", { className: 'flex-1', children: [_jsx("h1", { className: 'text-2xl font-canela text-foreground mb-2', children: displayTitle }), _jsxs("p", { className: 'text-sm text-muted-foreground', children: [formattedTime, " \u2022 ", event.venue] })] })] }) }), _jsx(EventCheckoutWizard, { event: event, displayTitle: displayTitle, onClose: handleCheckoutClose })] }) }) }));
};
export default EventTicketingPage;
