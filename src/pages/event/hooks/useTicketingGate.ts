import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/shared';
import { logger } from '@/shared';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  calculateEstimatedWaitTime,
  shouldNotifyPositionChange,
} from '@/shared';

interface TicketingGateState {
  canAccess: boolean;
  queuePosition: number | null;
  waitingCount: number;
  activeCount: number;
  isChecking: boolean;
  estimatedWaitMinutes: number;
}

export interface QueueEvent {
  type: 'promoted' | 'position_changed' | 'timeout_warning';
  data?: {
    oldPosition?: number;
    newPosition?: number;
    minutesRemaining?: number;
  };
}

interface UseTicketingGateOptions {
  maxConcurrent: number;
  sessionTimeoutMinutes?: number;
  onQueueEvent?: (event: QueueEvent) => void;
  useRealtime?: boolean;
}

interface SessionResponse {
  success: boolean;
  canAccess?: boolean;
  queuePosition?: number | null;
  waitingCount?: number;
  activeCount?: number;
  sessionStatus?: 'active' | 'waiting' | 'completed' | null;
  error?: string;
}

/**
 * Hook to manage ticketing gate/queue system for events
 * Uses a secure edge function to manage sessions (prevents queue manipulation)
 */
export const useTicketingGate = (
  eventId: string,
  options: UseTicketingGateOptions
) => {
  const {
    maxConcurrent,
    onQueueEvent,
    useRealtime = true,
  } = options;

  const [state, setState] = useState<TicketingGateState>({
    canAccess: false,
    queuePosition: null,
    waitingCount: 0,
    activeCount: 0,
    isChecking: true,
    estimatedWaitMinutes: 0,
  });

  const sessionIdRef = useRef<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const previousPositionRef = useRef<number | null>(null);

  // Generate a unique session ID for this browser session
  const getSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
    return sessionIdRef.current;
  }, []);

  /**
   * Call the ticketing session edge function
   */
  const callSessionApi = useCallback(async (
    action: 'enter' | 'exit' | 'status' | 'cleanup'
  ): Promise<SessionResponse | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('ticketing-session', {
        body: {
          action,
          eventId,
          sessionId: getSessionId(),
          maxConcurrent,
        },
      });

      if (error) {
        logger.error('Ticketing session API error', { error, action, eventId });
        return null;
      }

      return data as SessionResponse;
    } catch (error) {
      logger.error('Failed to call ticketing session API', { error, action, eventId });
      return null;
    }
  }, [eventId, getSessionId, maxConcurrent]);

  /**
   * Check current gate status
   */
  const checkGateStatus = useCallback(async () => {
    if (!eventId) return;

    try {
      const response = await callSessionApi('status');
      
      if (!response || !response.success) {
        setState(prev => ({ ...prev, isChecking: false }));
        return;
      }

      const currentActiveCount = response.activeCount ?? 0;
      const currentWaitingCount = response.waitingCount ?? 0;

      // If user has an active session, they can access
      if (response.canAccess) {
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
      if (response.sessionStatus === 'waiting' && response.queuePosition != null) {
        const newPosition = response.queuePosition;

        // Notify on position changes
        if (
          previousPositionRef.current !== null &&
          previousPositionRef.current !== newPosition &&
          shouldNotifyPositionChange(previousPositionRef.current, newPosition)
        ) {
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
        const estimatedWait = calculateEstimatedWaitTime(
          newPosition,
          currentActiveCount,
          maxConcurrent
        );

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
        waitingCount: currentWaitingCount ?? 0,
        activeCount: currentActiveCount ?? 0,
        isChecking: false,
        estimatedWaitMinutes: 0,
      });
    } catch (error) {
      logger.error('Failed to check gate status', { error, eventId });
      setState(prev => ({ ...prev, isChecking: false }));
    }
  }, [eventId, callSessionApi, onQueueEvent, maxConcurrent]);

  /**
   * Attempt to enter the ticketing gate
   * Returns true if successful, false if user must wait
   */
  const enterGate = useCallback(async (): Promise<boolean> => {
    if (!eventId) return false;

    try {
      const response = await callSessionApi('enter');
      
      if (!response || !response.success) {
        setState(prev => ({ ...prev, isChecking: false }));
        return false;
      }

      await checkGateStatus();
      return response.canAccess ?? false;
    } catch (error) {
      logger.error('Failed to enter gate', { error, eventId });
      setState(prev => ({ ...prev, isChecking: false }));
      return false;
    }
  }, [eventId, callSessionApi, checkGateStatus]);

  /**
   * Exit the ticketing gate (cleanup)
   */
  const exitGate = useCallback(async () => {
    if (!eventId) return;

    try {
      await callSessionApi('exit');
      logger.info('Exited ticketing gate', { eventId, sessionId: getSessionId() });
    } catch (error) {
      logger.error('Failed to exit gate', { error, eventId });
    }
  }, [eventId, callSessionApi, getSessionId]);

  // Set up real-time subscription or polling for status updates
  useEffect(() => {
    if (!state.canAccess && !state.isChecking && eventId) {
      // Try real-time subscription first
      if (useRealtime) {
        try {
          const channel = supabase
            .channel(`event-${eventId}-queue`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'ticketing_sessions',
                filter: `event_id=eq.${eventId}`,
              },
              () => {
                // Any change to ticketing sessions for this event - recheck status
                checkGateStatus();
              }
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                logger.info('Real-time queue updates subscribed', { eventId });
              } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
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
        } catch (error) {
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

  // Clean up old sessions via edge function (background cleanup)
  useEffect(() => {
    if (!eventId) return;

    const cleanupOldSessions = async () => {
      try {
        await callSessionApi('cleanup');
      } catch (error) {
        logger.error('Failed to cleanup old sessions', { error });
      }
    };

    // Run cleanup on mount
    cleanupOldSessions();

    // Run cleanup every 5 minutes
    const cleanupInterval = setInterval(cleanupOldSessions, 5 * 60 * 1000);

    return () => clearInterval(cleanupInterval);
  }, [eventId, callSessionApi]);

  // Auto-exit gate when browser tab closes or navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable unload handling
      const sessionId = sessionIdRef.current;
      if (sessionId && eventId) {
        // Note: sendBeacon doesn't support custom headers, 
        // but the edge function doesn't require auth
        const url = `https://orgxcrnnecblhuxjfruy.supabase.co/functions/v1/ticketing-session`;
        const body = JSON.stringify({
          action: 'exit',
          eventId,
          sessionId,
        });
        
        navigator.sendBeacon(url, body);
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
