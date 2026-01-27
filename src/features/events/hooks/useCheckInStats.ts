/**
 * useCheckInStats Hook
 *
 * Provides comprehensive check-in statistics for an event.
 * Combines ticket check-in status with scan event data.
 * Uses adaptive polling to reduce unnecessary API requests.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { logger } from '@/shared';
import { useAdaptivePolling, POLLING_PRESETS } from '@/shared/hooks/useAdaptivePolling';
import { useScanStatistics, useRecentScans, type ScanStatistics } from './useScanStatistics';

const checkInLogger = logger.createNamespace('CheckInStats');

/**
 * Per-tier check-in breakdown
 */
export interface TierCheckInStats {
  tierId: string;
  tierName: string;
  expected: number;
  checkedIn: number;
  percentage: number;
}

/**
 * Recent scan event with ticket details
 */
export interface RecentScanEvent {
  id: string;
  scanResult: 'success' | 'invalid' | 'already_used' | 'refunded' | 'cancelled';
  createdAt: string;
  attendeeName: string | null;
  attendeeEmail: string | null;
  tierName: string | null;
}

/**
 * Complete check-in statistics for an event
 */
export interface CheckInStats {
  /** Total number of tickets sold (expected attendees) */
  expectedAttendees: number;
  /** Number of tickets that have been checked in */
  checkedIn: number;
  /** Check-in percentage (0-100) */
  checkInPercentage: number;
  /** Per-tier breakdown of check-ins */
  tierBreakdown: TierCheckInStats[];
  /** Scan statistics from ticket_scan_events */
  scanStats: ScanStatistics;
  /** Recent scan events */
  recentScans: RecentScanEvent[];
  /** Whether data is being refreshed */
  isRefetching: boolean;
}

export interface CheckInStatsOptions {
  /** Event ID to get statistics for */
  eventId: string;
  /**
   * Refresh interval in milliseconds
   * Default: 30000 (30 seconds) for normal mode
   * Set to 5000 for "live mode" during event (reduced from 2000 for better performance)
   */
  refreshInterval?: number;
  /** Whether the query is enabled */
  enabled?: boolean;
  /**
   * Whether to use adaptive polling (recommended)
   * When true, uses smart backoff and tab visibility detection
   * @default true
   */
  useAdaptive?: boolean;
}

/**
 * Query key factory for check-in stats
 */
export const checkInStatsKeys = {
  all: ['check-in-stats'] as const,
  byEvent: (eventId: string) => [...checkInStatsKeys.all, eventId] as const,
};

/**
 * Fetches check-in statistics by querying the tickets table
 */
async function fetchCheckInData(eventId: string): Promise<{
  expectedAttendees: number;
  checkedIn: number;
  tierBreakdown: TierCheckInStats[];
}> {
  // Query tickets with their tier information, grouped by check-in status
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select(`
      id,
      checked_in_at,
      ticket_tier_id,
      ticket_tiers (
        id,
        name
      )
    `)
    .eq('event_id', eventId)
    .in('status', ['valid', 'scanned']); // Only count valid/scanned tickets

  if (error) {
    checkInLogger.error('Error fetching ticket check-in data', {
      error: error.message,
      eventId,
    });
    throw error;
  }

  if (!tickets || tickets.length === 0) {
    return {
      expectedAttendees: 0,
      checkedIn: 0,
      tierBreakdown: [],
    };
  }

  // Calculate totals
  const expectedAttendees = tickets.length;
  const checkedIn = tickets.filter((t) => t.checked_in_at !== null).length;

  // Group by tier for breakdown
  const tierMap = new Map<string, { name: string; expected: number; checkedIn: number }>();

  tickets.forEach((ticket) => {
    const tierId = ticket.ticket_tier_id;
    const tierName = (ticket.ticket_tiers as { id: string; name: string } | null)?.name ?? 'Unknown';

    if (!tierMap.has(tierId)) {
      tierMap.set(tierId, { name: tierName, expected: 0, checkedIn: 0 });
    }

    const tier = tierMap.get(tierId)!;
    tier.expected += 1;
    if (ticket.checked_in_at !== null) {
      tier.checkedIn += 1;
    }
  });

  const tierBreakdown: TierCheckInStats[] = Array.from(tierMap.entries()).map(
    ([tierId, data]) => ({
      tierId,
      tierName: data.name,
      expected: data.expected,
      checkedIn: data.checkedIn,
      percentage: data.expected > 0 ? Math.round((data.checkedIn / data.expected) * 100) : 0,
    })
  );

  return {
    expectedAttendees,
    checkedIn,
    tierBreakdown,
  };
}

/**
 * Transform raw scan event data to RecentScanEvent format
 */
function transformRecentScans(rawScans: unknown[]): RecentScanEvent[] {
  return rawScans.map((scan: unknown) => {
    const s = scan as {
      id: string;
      scan_result: string;
      created_at: string;
      tickets?: {
        attendee_name: string | null;
        attendee_email: string | null;
        ticket_tiers?: { name: string } | null;
      } | null;
    };

    return {
      id: s.id,
      scanResult: s.scan_result as RecentScanEvent['scanResult'],
      createdAt: s.created_at,
      attendeeName: s.tickets?.attendee_name ?? null,
      attendeeEmail: s.tickets?.attendee_email ?? null,
      tierName: s.tickets?.ticket_tiers?.name ?? null,
    };
  });
}

/**
 * Hook for fetching comprehensive check-in statistics
 *
 * @param options - Configuration options
 * @returns Check-in statistics including scan data and tier breakdown
 *
 * @example
 * ```tsx
 * // Normal mode (30s refresh with adaptive polling)
 * const { data } = useCheckInStats({ eventId });
 *
 * // Live mode (5s refresh for day-of-event)
 * const { data } = useCheckInStats({ eventId, refreshInterval: 5000 });
 * ```
 */
export function useCheckInStats(options: CheckInStatsOptions) {
  const { eventId, refreshInterval = 30000, enabled = true, useAdaptive = true } = options;

  // Use the existing scan statistics hook (already uses adaptive polling)
  const scanStatsQuery = useScanStatistics({
    eventId,
    refreshInterval: enabled ? refreshInterval : 0,
    useAdaptive,
  });

  // Use the existing recent scans hook (already uses adaptive polling)
  const recentScansQuery = useRecentScans({ eventId, limit: 20, useAdaptive });

  // Query for check-in data from tickets table
  // Use adaptive polling for the check-in query as well
  const checkInQueryKey = checkInStatsKeys.byEvent(eventId);
  const checkInQueryFn = () => fetchCheckInData(eventId);

  const checkInQueryAdaptive = useAdaptivePolling(
    checkInQueryKey,
    checkInQueryFn,
    {
      ...POLLING_PRESETS.REALTIME,
      baseInterval: refreshInterval,
    },
    {
      enabled: enabled && !!eventId && useAdaptive,
    }
  );

  const checkInQueryStandard = useQuery({
    queryKey: checkInQueryKey,
    queryFn: checkInQueryFn,
    enabled: enabled && !!eventId && !useAdaptive,
    refetchInterval: refreshInterval,
    staleTime: 10000,
  });

  // Use adaptive or standard query based on option
  const checkInQuery = useAdaptive ? checkInQueryAdaptive : checkInQueryStandard;

  // Combine all data
  const isLoading = checkInQuery.isLoading || scanStatsQuery.isLoading || recentScansQuery.isLoading;
  const isRefetching = checkInQuery.isFetching || scanStatsQuery.isFetching || recentScansQuery.isFetching;
  const error = checkInQuery.error || scanStatsQuery.error || recentScansQuery.error;

  const checkInData = checkInQuery.data;
  const scanStats = scanStatsQuery.data;
  const recentScans = recentScansQuery.data;

  // Build the combined stats object
  const data: CheckInStats | undefined = checkInData && scanStats
    ? {
        expectedAttendees: checkInData.expectedAttendees,
        checkedIn: checkInData.checkedIn,
        checkInPercentage: checkInData.expectedAttendees > 0
          ? Math.round((checkInData.checkedIn / checkInData.expectedAttendees) * 100)
          : 0,
        tierBreakdown: checkInData.tierBreakdown,
        scanStats,
        recentScans: recentScans ? transformRecentScans(recentScans) : [],
        isRefetching,
      }
    : undefined;

  return {
    data,
    isLoading,
    isRefetching,
    error,
    refetch: () => {
      checkInQuery.refetch();
      scanStatsQuery.refetch();
      recentScansQuery.refetch();
    },
  };
}
