/**
 * useAdaptivePolling Hook
 *
 * A smart polling hook that reduces unnecessary API requests by:
 * - Pausing polling when the browser tab is hidden
 * - Using exponential backoff when data hasn't changed
 * - Speeding up polling on user activity
 * - Providing configurable min/max intervals
 *
 * This helps reduce server load while maintaining real-time feel for users.
 */

import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export interface AdaptivePollingOptions {
  /**
   * Base polling interval in milliseconds (starting point)
   * @default 30000 (30 seconds)
   */
  baseInterval: number;

  /**
   * Minimum polling interval when actively engaged
   * @default 5000 (5 seconds)
   */
  minInterval: number;

  /**
   * Maximum polling interval when idle/data unchanged
   * @default 120000 (2 minutes)
   */
  maxInterval: number;

  /**
   * Multiplier for backoff when data unchanged
   * @default 1.5
   */
  backoffMultiplier: number;

  /**
   * Whether to pause polling when browser tab is hidden
   * @default true
   */
  pauseWhenHidden: boolean;

  /**
   * Whether the query is enabled
   * @default true
   */
  enabled?: boolean;
}

const DEFAULT_OPTIONS: AdaptivePollingOptions = {
  baseInterval: 30000,
  minInterval: 5000,
  maxInterval: 120000,
  backoffMultiplier: 1.5,
  pauseWhenHidden: true,
  enabled: true,
};

/**
 * Hook to track browser tab visibility
 */
function useTabVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(() =>
    typeof document !== 'undefined' ? !document.hidden : true
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

/**
 * Hook to detect user activity (mouse move, key press, scroll)
 */
function useUserActivity(timeoutMs: number = 30000): boolean {
  const [isActive, setIsActive] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const resetTimer = () => {
      setIsActive(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsActive(false);
      }, timeoutMs);
    };

    // Initial timer
    resetTimer();

    // Activity events
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [timeoutMs]);

  return isActive;
}

/**
 * Compare two values for deep equality (simple JSON comparison)
 */
function hasDataChanged<T>(prevData: T | undefined, newData: T | undefined): boolean {
  if (prevData === undefined && newData === undefined) return false;
  if (prevData === undefined || newData === undefined) return true;

  try {
    return JSON.stringify(prevData) !== JSON.stringify(newData);
  } catch {
    // If JSON stringify fails, assume data changed
    return true;
  }
}

/**
 * useAdaptivePolling - Smart polling with backoff and visibility awareness
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useAdaptivePolling(
 *   ['scanStatistics', eventId],
 *   () => fetchScanStatistics(eventId),
 *   {
 *     baseInterval: 15000,
 *     minInterval: 5000,
 *     maxInterval: 60000,
 *     pauseWhenHidden: true,
 *   }
 * );
 * ```
 */
export function useAdaptivePolling<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options: Partial<AdaptivePollingOptions> = {},
  queryOptions?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn' | 'refetchInterval'>
) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const {
    baseInterval,
    minInterval,
    maxInterval,
    backoffMultiplier,
    pauseWhenHidden,
    enabled = true,
  } = mergedOptions;

  // Track tab visibility and user activity
  const isTabVisible = useTabVisibility();
  const isUserActive = useUserActivity(30000);

  // Track current interval with backoff
  const [currentInterval, setCurrentInterval] = useState(baseInterval);

  // Track previous data for change detection
  const previousDataRef = useRef<TData | undefined>(undefined);

  // Determine if polling should be active
  const shouldPoll = useMemo(() => {
    if (!enabled) return false;
    if (pauseWhenHidden && !isTabVisible) return false;
    return true;
  }, [enabled, pauseWhenHidden, isTabVisible]);

  // Calculate effective interval based on activity
  const effectiveInterval = useMemo(() => {
    if (!shouldPoll) return false; // Disable polling

    // If user is active, use minimum interval for responsiveness
    if (isUserActive) {
      return Math.max(minInterval, currentInterval / 2);
    }

    return currentInterval;
  }, [shouldPoll, isUserActive, minInterval, currentInterval]);

  // Callback to adjust interval based on data changes
  const handleDataChange = useCallback(
    (data: TData | undefined) => {
      const dataChanged = hasDataChanged(previousDataRef.current, data);
      previousDataRef.current = data;

      if (dataChanged) {
        // Data changed - reset to base interval
        setCurrentInterval(baseInterval);
      } else {
        // Data unchanged - apply backoff
        setCurrentInterval(prev => Math.min(prev * backoffMultiplier, maxInterval));
      }
    },
    [baseInterval, backoffMultiplier, maxInterval]
  );

  // Reset interval when tab becomes visible
  useEffect(() => {
    if (isTabVisible && pauseWhenHidden) {
      // Reset to base interval when tab becomes visible again
      setCurrentInterval(baseInterval);
    }
  }, [isTabVisible, pauseWhenHidden, baseInterval]);

  const query = useQuery<TData, TError>({
    queryKey,
    queryFn,
    refetchInterval: effectiveInterval,
    ...queryOptions,
    enabled: enabled && shouldPoll,
  });

  // Track data changes after each successful fetch
  useEffect(() => {
    if (query.data !== undefined) {
      handleDataChange(query.data);
    }
  }, [query.data, handleDataChange]);

  return {
    ...query,
    // Expose adaptive polling state for debugging/monitoring
    pollingState: {
      currentInterval,
      effectiveInterval: effectiveInterval === false ? 0 : effectiveInterval,
      isTabVisible,
      isUserActive,
      isPaused: !shouldPoll,
    },
    // Allow manual reset of polling interval
    resetInterval: useCallback(() => {
      setCurrentInterval(baseInterval);
    }, [baseInterval]),
  };
}

/**
 * Preset configurations for common use cases
 */
export const POLLING_PRESETS = {
  /**
   * For real-time displays during active events (check-in, scan stats)
   * Base: 15s, Min: 5s, Max: 60s
   */
  REALTIME: {
    baseInterval: 15000,
    minInterval: 5000,
    maxInterval: 60000,
    backoffMultiplier: 1.5,
    pauseWhenHidden: true,
  },

  /**
   * For inventory tracking (ticket availability)
   * Base: 30s, Min: 15s, Max: 180s
   */
  INVENTORY: {
    baseInterval: 30000,
    minInterval: 15000,
    maxInterval: 180000,
    backoffMultiplier: 1.5,
    pauseWhenHidden: true,
  },

  /**
   * For monitoring/dashboard displays (error logs, admin panels)
   * Base: 60s, Min: 30s, Max: 300s
   */
  MONITORING: {
    baseInterval: 60000,
    minInterval: 30000,
    maxInterval: 300000,
    backoffMultiplier: 2,
    pauseWhenHidden: true,
  },
} as const;
