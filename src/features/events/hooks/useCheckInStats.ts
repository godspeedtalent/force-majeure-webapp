/**
 * useCheckInStats Hook
 *
 * Provides comprehensive check-in statistics for an event.
 * Combines ticket check-in status with scan event data.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { logger } from '@/shared';
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
   * Set to 2000 for "live mode" during event
   */
  refreshInterval?: number;
  /** Whether the query is enabled */
  enabled?: boolean;
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
 * // Normal mode (30s refresh)
 * const { data } = useCheckInStats({ eventId });
 *
 * // Live mode (2s refresh for day-of-event)
 * const { data } = useCheckInStats({ eventId, refreshInterval: 2000 });
 * ```
 */
export function useCheckInStats(options: CheckInStatsOptions) {
  const { eventId, refreshInterval = 30000, enabled = true } = options;

  // Use the existing scan statistics hook
  const scanStatsQuery = useScanStatistics({
    eventId,
    refreshInterval: enabled ? refreshInterval : 0,
  });

  // Use the existing recent scans hook
  const recentScansQuery = useRecentScans(eventId, 20);

  // Query for check-in data from tickets table
  const checkInQuery = useQuery({
    queryKey: checkInStatsKeys.byEvent(eventId),
    queryFn: () => fetchCheckInData(eventId),
    enabled: enabled && !!eventId,
    refetchInterval: refreshInterval,
    staleTime: 10000,
  });

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
