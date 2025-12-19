import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/shared';
import { logger } from '@/shared';
import { calculateEstimatedWaitTime, shouldNotifyPositionChange, } from '@/shared';
/**
 * Hook to manage ticketing gate/queue system for events
 * Limits the number of concurrent users who can access ticketing for an event
 */
export const useTicketingGate = (eventId, options) => {
    const { maxConcurrent, sessionTimeoutMinutes = 30, onQueueEvent, useRealtime = true, } = options;
    const [state, setState] = useState({
        canAccess: false,
        queuePosition: null,
        waitingCount: 0,
        activeCount: 0,
        isChecking: true,
        estimatedWaitMinutes: 0,
    });
    const sessionIdRef = useRef(null);
    const pollingIntervalRef = useRef(null);
    const realtimeChannelRef = useRef(null);
    const previousPositionRef = useRef(null);
    // Generate a unique session ID for this browser session
    const getSessionId = useCallback(() => {
        if (!sessionIdRef.current) {
            sessionIdRef.current = `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        }
        return sessionIdRef.current;
    }, []);
    /**
     * Check current gate status
     */
    const checkGateStatus = useCallback(async () => {
        if (!eventId)
            return;
        try {
            const sessionId = getSessionId();
            // Get current user's session if it exists
            const { data: userSession } = await supabase
                .from('ticketing_sessions')
                .select('*')
                .eq('event_id', eventId)
                .eq('user_session_id', sessionId)
                .in('status', ['active', 'waiting'])
                .single();
            // Count active sessions
            const { count: activeCount } = await supabase
                .from('ticketing_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', eventId)
                .eq('status', 'active');
            // Count waiting sessions
            const { count: waitingCount } = await supabase
                .from('ticketing_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', eventId)
                .eq('status', 'waiting');
            const currentActiveCount = activeCount ?? 0;
            const currentWaitingCount = waitingCount ?? 0;
            // If user has an active session, they can access
            if (userSession?.status === 'active') {
                // Check if promoted from waiting
                if (previousPositionRef.current !== null && previousPositionRef.current > 0) {
                    onQueueEvent?.({
                        type: 'promoted',
                        data: {
                            oldPosition: previousPositionRef.current,
                            newPosition: 0,
                        },
                    });
                }
                previousPositionRef.current = null;
                setState({
                    canAccess: true,
                    queuePosition: null,
                    waitingCount: currentWaitingCount,
                    activeCount: currentActiveCount,
                    isChecking: false,
                    estimatedWaitMinutes: 0,
                });
                return;
            }
            // If user is waiting, calculate their position
            if (userSession?.status === 'waiting') {
                // Get all waiting sessions before this one
                const { count: positionCount } = await supabase
                    .from('ticketing_sessions')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', eventId)
                    .eq('status', 'waiting')
                    .lt('created_at', userSession.created_at);
                const newPosition = (positionCount ?? 0) + 1;
                // Notify on position changes
                if (previousPositionRef.current !== null &&
                    previousPositionRef.current !== newPosition &&
                    shouldNotifyPositionChange(previousPositionRef.current, newPosition)) {
                    onQueueEvent?.({
                        type: 'position_changed',
                        data: {
                            oldPosition: previousPositionRef.current,
                            newPosition,
                        },
                    });
                }
                previousPositionRef.current = newPosition;
                // Calculate estimated wait time
                const estimatedWait = calculateEstimatedWaitTime(newPosition, currentActiveCount, maxConcurrent);
                setState({
                    canAccess: false,
                    queuePosition: newPosition,
                    waitingCount: currentWaitingCount,
                    activeCount: currentActiveCount,
                    isChecking: false,
                    estimatedWaitMinutes: estimatedWait,
                });
                return;
            }
            // No session exists yet
            setState({
                canAccess: false,
                queuePosition: null,
                waitingCount: currentWaitingCount,
                activeCount: currentActiveCount,
                isChecking: false,
                estimatedWaitMinutes: 0,
            });
        }
        catch (error) {
            logger.error('Failed to check gate status', { error, eventId });
            setState(prev => ({ ...prev, isChecking: false }));
        }
    }, [eventId, getSessionId, onQueueEvent, maxConcurrent]);
    /**
     * Attempt to enter the ticketing gate
     * Returns true if successful, false if user must wait
     */
    const enterGate = useCallback(async () => {
        if (!eventId)
            return false;
        try {
            const sessionId = getSessionId();
            // Check if user already has a session
            const { data: existingSession } = await supabase
                .from('ticketing_sessions')
                .select('*')
                .eq('event_id', eventId)
                .eq('user_session_id', sessionId)
                .in('status', ['active', 'waiting'])
                .single();
            if (existingSession) {
                // Activate if already active
                if (existingSession.status === 'active') {
                    await checkGateStatus();
                    return true;
                }
                // Try to promote from waiting to active
                const { count: activeCount } = await supabase
                    .from('ticketing_sessions')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', eventId)
                    .eq('status', 'active');
                if ((activeCount ?? 0) < maxConcurrent) {
                    // Space available, promote to active
                    await supabase
                        .from('ticketing_sessions')
                        .update({
                        status: 'active',
                        entered_at: new Date().toISOString(),
                    })
                        .eq('id', existingSession.id);
                    await checkGateStatus();
                    return true;
                }
                // Still waiting
                await checkGateStatus();
                return false;
            }
            // Create new session
            // First check if there's space
            const { count: activeCount } = await supabase
                .from('ticketing_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', eventId)
                .eq('status', 'active');
            const status = (activeCount ?? 0) < maxConcurrent ? 'active' : 'waiting';
            const enteredAt = status === 'active' ? new Date().toISOString() : null;
            const { error: insertError } = await supabase
                .from('ticketing_sessions')
                .insert({
                event_id: eventId,
                user_session_id: sessionId,
                status,
                entered_at: enteredAt,
            });
            if (insertError) {
                logger.error('Failed to create ticketing session', {
                    error: insertError,
                    details: insertError.details,
                    hint: insertError.hint,
                    code: insertError.code,
                });
                setState(prev => ({ ...prev, isChecking: false }));
                return false;
            }
            await checkGateStatus();
            return status === 'active';
        }
        catch (error) {
            logger.error('Failed to enter gate', { error, eventId });
            setState(prev => ({ ...prev, isChecking: false }));
            return false;
        }
    }, [eventId, maxConcurrent, getSessionId, checkGateStatus]);
    /**
     * Exit the ticketing gate (cleanup)
     */
    const exitGate = useCallback(async () => {
        if (!eventId)
            return;
        try {
            const sessionId = getSessionId();
            // Mark session as completed
            await supabase
                .from('ticketing_sessions')
                .update({ status: 'completed' })
                .eq('event_id', eventId)
                .eq('user_session_id', sessionId);
            // Try to promote the next waiting user
            const { data: nextWaiting } = await supabase
                .from('ticketing_sessions')
                .select('*')
                .eq('event_id', eventId)
                .eq('status', 'waiting')
                .order('created_at', { ascending: true })
                .limit(1)
                .single();
            if (nextWaiting) {
                await supabase
                    .from('ticketing_sessions')
                    .update({
                    status: 'active',
                    entered_at: new Date().toISOString(),
                })
                    .eq('id', nextWaiting.id);
            }
            logger.info('Exited ticketing gate', { eventId, sessionId });
        }
        catch (error) {
            logger.error('Failed to exit gate', { error, eventId });
        }
    }, [eventId, getSessionId]);
    // Set up real-time subscription or polling for status updates
    useEffect(() => {
        if (!state.canAccess && !state.isChecking && eventId) {
            // Try real-time subscription first
            if (useRealtime) {
                try {
                    const channel = supabase
                        .channel(`event-${eventId}-queue`)
                        .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'ticketing_sessions',
                        filter: `event_id=eq.${eventId}`,
                    }, () => {
                        // Any change to ticketing sessions for this event - recheck status
                        checkGateStatus();
                    })
                        .subscribe((status) => {
                        if (status === 'SUBSCRIBED') {
                            logger.info('Real-time queue updates subscribed', { eventId });
                        }
                        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                            logger.warn('Real-time subscription failed, falling back to polling', {
                                status,
                            });
                            // Fallback to polling
                            pollingIntervalRef.current = setInterval(() => {
                                checkGateStatus();
                            }, 3000);
                        }
                    });
                    realtimeChannelRef.current = channel;
                    return () => {
                        if (realtimeChannelRef.current) {
                            supabase.removeChannel(realtimeChannelRef.current);
                            realtimeChannelRef.current = null;
                        }
                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                        }
                    };
                }
                catch (error) {
                    logger.error('Failed to setup real-time subscription', { error });
                    // Fallback to polling
                }
            }
            // Use polling if real-time is disabled or failed
            if (!useRealtime || !realtimeChannelRef.current) {
                pollingIntervalRef.current = setInterval(() => {
                    checkGateStatus();
                }, 3000);
                return () => {
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                };
            }
        }
        return undefined;
    }, [state.canAccess, state.isChecking, eventId, checkGateStatus, useRealtime]);
    // Clean up sessions older than configured timeout (background cleanup)
    useEffect(() => {
        if (!eventId)
            return;
        const cleanupOldSessions = async () => {
            try {
                const timeoutAgo = new Date(Date.now() - sessionTimeoutMinutes * 60 * 1000).toISOString();
                await supabase
                    .from('ticketing_sessions')
                    .update({ status: 'completed' })
                    .eq('event_id', eventId)
                    .in('status', ['active', 'waiting'])
                    .lt('created_at', timeoutAgo);
            }
            catch (error) {
                logger.error('Failed to cleanup old sessions', { error });
            }
        };
        // Run cleanup on mount
        cleanupOldSessions();
        // Run cleanup every 5 minutes
        const cleanupInterval = setInterval(cleanupOldSessions, 5 * 60 * 1000);
        return () => clearInterval(cleanupInterval);
    }, [eventId, sessionTimeoutMinutes]);
    // Auto-exit gate when browser tab closes or navigates away
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Call exitGate synchronously during unload
            const sessionId = sessionIdRef.current;
            if (sessionId && eventId) {
                // Try to mark session as completed
                // Note: This may not always succeed due to browser unload timing
                // The cleanup function will handle orphaned sessions
                void supabase
                    .from('ticketing_sessions')
                    .update({ status: 'completed' })
                    .eq('event_id', eventId)
                    .eq('user_session_id', sessionId);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [eventId]);
    return {
        ...state,
        enterGate,
        exitGate,
        checkGateStatus,
    };
};
