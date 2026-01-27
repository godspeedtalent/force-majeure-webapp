/**
 * useScanStatistics Hook
 *
 * Provides real-time scan statistics for an event.
 * Uses adaptive polling that:
 * - Pauses when browser tab is hidden
 * - Backs off when data hasn't changed
 * - Speeds up when user is actively engaged
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { logger } from '@/shared';
import { useAdaptivePolling, POLLING_PRESETS } from '@/shared/hooks/useAdaptivePolling';

const scanLogger = logger.createNamespace('ScanStatistics');

// Helper for untyped tables (ticket_scan_events not yet in generated types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getScanEventsTable = () => (supabase as any).from('ticket_scan_events');

// Interface for scan event data (table not in generated types)
interface ScanEventData {
  id: string;
  scan_result: 'success' | 'invalid' | 'already_used' | 'refunded' | 'cancelled';
  ticket_id: string | null;
  event_id: string;
  created_at: string;
}

export interface ScanStatistics {
  totalScans: number;
  successfulScans: number;
  invalidScans: number;
  duplicateScans: number;
  rejectedScans: number;
  uniqueTicketsScanned: number;
  firstScan: string | null;
  lastScan: string | null;
}

export interface ScanStatisticsOptions {
  /**
   * Event ID to get statistics for
   * If not provided, returns stats for all events
   */
  eventId?: string;

  /**
   * Date to get statistics for
   * Defaults to today
   */
  date?: Date;

  /**
   * Auto-refresh interval in milliseconds
   * @deprecated Use adaptive polling presets instead. This is now the base interval.
   * Default: 15000 (15 seconds) - reduced from 5s to prevent excessive requests
   * Set to 0 to disable auto-refresh
   */
  refreshInterval?: number;

  /**
   * Whether to use adaptive polling (recommended)
   * When true, uses smart backoff and tab visibility detection
   * @default true
   */
  useAdaptive?: boolean;
}

/**
 * Fetches scan statistics for today's scans
 *
 * @param options - Configuration options
 * @returns React Query result with scan statistics
 */
export function useScanStatistics(options: ScanStatisticsOptions = {}) {
  const { eventId, date, refreshInterval = 15000, useAdaptive = true } = options;

  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const queryKey = ['scanStatistics', eventId, startOfDay.toISOString()];

  const queryFn = async (): Promise<ScanStatistics> => {
    try {
      // Build query
      let query = getScanEventsTable()
        .select('*')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      // Filter by event if provided
      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data: rawData, error } = await query;
      const data = rawData as ScanEventData[] | null;

      if (error) {
        scanLogger.error('Error fetching scan statistics', {
          error: error.message,
          eventId,
          date: targetDate.toISOString(),
        });
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          totalScans: 0,
          successfulScans: 0,
          invalidScans: 0,
          duplicateScans: 0,
          rejectedScans: 0,
          uniqueTicketsScanned: 0,
          firstScan: null,
          lastScan: null,
        };
      }

      // Calculate statistics
      const totalScans = data.length;
      const successfulScans = data.filter(s => s.scan_result === 'success')
        .length;
      const invalidScans = data.filter(s => s.scan_result === 'invalid')
        .length;
      const duplicateScans = data.filter(s => s.scan_result === 'already_used')
        .length;
      const rejectedScans = data.filter(
        s => s.scan_result === 'refunded' || s.scan_result === 'cancelled'
      ).length;

      // Count unique tickets scanned (only successful scans)
      const successfulTicketIds = new Set(
        data
          .filter(s => s.scan_result === 'success' && s.ticket_id)
          .map(s => s.ticket_id)
      );
      const uniqueTicketsScanned = successfulTicketIds.size;

      // Find first and last scan times
      const sortedScans = [...data].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      const firstScan = sortedScans[0]?.created_at || null;
      const lastScan = sortedScans[sortedScans.length - 1]?.created_at || null;

      return {
        totalScans,
        successfulScans,
        invalidScans,
        duplicateScans,
        rejectedScans,
        uniqueTicketsScanned,
        firstScan,
        lastScan,
      };
    } catch (error) {
      scanLogger.error('Error calculating scan statistics', {
        error: error instanceof Error ? error.message : 'Unknown',
        eventId,
      });
      throw error;
    }
  };

  // Use adaptive polling for smarter request management
  if (useAdaptive && refreshInterval > 0) {
    return useAdaptivePolling(queryKey, queryFn, {
      ...POLLING_PRESETS.REALTIME,
      baseInterval: refreshInterval,
    });
  }

  // Fallback to standard polling for backwards compatibility
  return useQuery({
    queryKey,
    queryFn,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    staleTime: refreshInterval > 0 ? refreshInterval : Infinity,
  });
}

export interface RecentScansOptions {
  /**
   * Event ID to filter by (optional)
   */
  eventId?: string;

  /**
   * Maximum number of events to return
   * @default 10
   */
  limit?: number;

  /**
   * Whether to use adaptive polling (recommended)
   * @default true
   */
  useAdaptive?: boolean;
}

/**
 * Hook for fetching recent scan events
 *
 * @param options - Configuration options (can also pass eventId directly for backwards compatibility)
 * @param limit - Maximum number of events to return (default: 10) - deprecated, use options object
 * @returns React Query result with recent scan events
 */
export function useRecentScans(
  optionsOrEventId?: RecentScansOptions | string,
  legacyLimit?: number
) {
  // Support both old signature (eventId, limit) and new signature (options)
  const options: RecentScansOptions =
    typeof optionsOrEventId === 'string'
      ? { eventId: optionsOrEventId, limit: legacyLimit }
      : optionsOrEventId || {};

  const { eventId, limit = 10, useAdaptive = true } = options;

  const queryKey = ['recentScans', eventId, limit];

  const queryFn = async () => {
    try {
      let query = getScanEventsTable()
        .select(
          `
          *,
          tickets (
            id,
            attendee_name,
            attendee_email,
            ticket_tiers (
              name
            )
          ),
          events (
            title
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;

      if (error) {
        scanLogger.error('Error fetching recent scans', {
          error: error.message,
          eventId,
        });
        throw error;
      }

      return data || [];
    } catch (error) {
      scanLogger.error('Error in useRecentScans', {
        error: error instanceof Error ? error.message : 'Unknown',
        eventId,
      });
      throw error;
    }
  };

  // Use adaptive polling for smarter request management
  if (useAdaptive) {
    return useAdaptivePolling(queryKey, queryFn, {
      ...POLLING_PRESETS.REALTIME,
      baseInterval: 15000, // 15 seconds base (reduced from 5s)
    });
  }

  // Fallback to standard polling
  return useQuery({
    queryKey,
    queryFn,
    refetchInterval: 15000,
  });
}
