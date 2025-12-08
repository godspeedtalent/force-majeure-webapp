/**
 * useScanStatistics Hook
 *
 * Provides real-time scan statistics for an event.
 * Automatically refreshes every 5 seconds to show live data.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@force-majeure/shared/api/supabase/client';
import { logger } from '@force-majeure/shared/services/logger';

const scanLogger = logger.createNamespace('ScanStatistics');

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
   * Default: 5000 (5 seconds)
   * Set to 0 to disable auto-refresh
   */
  refreshInterval?: number;
}

/**
 * Fetches scan statistics for today's scans
 *
 * @param options - Configuration options
 * @returns React Query result with scan statistics
 */
export function useScanStatistics(options: ScanStatisticsOptions = {}) {
  const { eventId, date, refreshInterval = 5000 } = options;

  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  return useQuery({
    queryKey: ['scanStatistics', eventId, startOfDay.toISOString()],
    queryFn: async (): Promise<ScanStatistics> => {
      try {
        // Build query
        let query = supabase
          .from('ticket_scan_events')
          .select('*')
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());

        // Filter by event if provided
        if (eventId) {
          query = query.eq('event_id', eventId);
        }

        const { data, error } = await query;

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
    },
    refetchInterval: refreshInterval,
    staleTime: refreshInterval > 0 ? refreshInterval : Infinity,
  });
}

/**
 * Hook for fetching recent scan events
 *
 * @param eventId - Event ID to filter by (optional)
 * @param limit - Maximum number of events to return (default: 10)
 * @returns React Query result with recent scan events
 */
export function useRecentScans(eventId?: string, limit: number = 10) {
  return useQuery({
    queryKey: ['recentScans', eventId, limit],
    queryFn: async () => {
      try {
        let query = supabase
          .from('ticket_scan_events')
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
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}
