/**
 * useChartLabels Hook
 *
 * Provides chart label persistence for any chart type.
 * Labels are stored per-user in the chart_labels table.
 *
 * @example
 * ```tsx
 * const { labels, setLabel, removeLabel, isLoading } = useChartLabels('page_views_chart');
 *
 * // Use with FmLineChart
 * <FmLineChart
 *   data={chartData}
 *   labels={labels}
 *   onLabelChange={(pointId, label) => {
 *     if (label) {
 *       setLabel(pointId, label);
 *     } else {
 *       removeLabel(pointId);
 *     }
 *   }}
 * />
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logger } from '@/shared/services/logger';
import type { ChartLabel, ChartLabelsMap } from '../types';

interface UseChartLabelsOptions {
  /** Auto-save debounce delay in ms (default: 500) */
  debounceMs?: number;
  /** Enable optimistic updates (default: true) */
  optimistic?: boolean;
}

interface UseChartLabelsReturn {
  /** Labels as a map of pointId -> label text */
  labels: ChartLabelsMap;
  /** Full label records from database */
  labelRecords: ChartLabel[];
  /** Set or update a label for a point */
  setLabel: (pointId: string, label: string, markerColor?: string) => Promise<void>;
  /** Remove a label from a point */
  removeLabel: (pointId: string) => Promise<void>;
  /** Handle label change (compatible with FmLineChart onLabelChange) */
  handleLabelChange: (pointId: string, label: string | undefined) => void;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Refresh labels from database */
  refresh: () => Promise<void>;
}

export function useChartLabels(
  chartId: string,
  options: UseChartLabelsOptions = {}
): UseChartLabelsReturn {
  const { debounceMs = 500, optimistic = true } = options;
  const { user } = useAuth();

  const [labelRecords, setLabelRecords] = useState<ChartLabel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, NodeJS.Timeout>>(new Map());

  // Convert label records to map for FmLineChart compatibility
  const labels = useMemo<ChartLabelsMap>(() => {
    return labelRecords.reduce((acc, record) => {
      acc[record.point_id] = record.label;
      return acc;
    }, {} as ChartLabelsMap);
  }, [labelRecords]);

  // Fetch labels from database
  const fetchLabels = useCallback(async () => {
    if (!user?.id || !chartId) {
      setLabelRecords([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from('chart_labels')
        .select('*')
        .eq('chart_id', chartId)
        .eq('created_by', user.id);

      if (fetchError) {
        throw fetchError;
      }

      setLabelRecords((data as ChartLabel[]) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch labels';
      logger.error('Error fetching chart labels', {
        error: message,
        source: 'useChartLabels',
        details: { chartId, userId: user?.id },
      });
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [chartId, user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  // Set or update a label
  const setLabel = useCallback(
    async (pointId: string, label: string, markerColor?: string) => {
      if (!user?.id || !chartId) return;

      // Optimistic update
      if (optimistic) {
        setLabelRecords((prev) => {
          const existing = prev.find((r) => r.point_id === pointId);
          if (existing) {
            return prev.map((r) =>
              r.point_id === pointId ? { ...r, label, marker_color: markerColor ?? r.marker_color } : r
            );
          }
          // Add new optimistic record
          return [
            ...prev,
            {
              id: `temp-${pointId}`,
              chart_id: chartId,
              point_id: pointId,
              label,
              marker_color: markerColor ?? null,
              metadata: {},
              created_by: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ];
        });
      }

      try {
        // Use upsert to handle both insert and update
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: upsertError } = await (supabase as any)
          .from('chart_labels')
          .upsert(
            {
              chart_id: chartId,
              point_id: pointId,
              label,
              marker_color: markerColor,
              created_by: user.id,
            },
            {
              onConflict: 'chart_id,point_id,created_by',
            }
          );

        if (upsertError) {
          throw upsertError;
        }

        // Refresh to get the actual record with proper ID
        if (!optimistic) {
          await fetchLabels();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save label';
        logger.error('Error saving chart label', {
          error: message,
          source: 'useChartLabels',
          details: { chartId, pointId, userId: user?.id },
        });

        // Rollback optimistic update on error
        if (optimistic) {
          await fetchLabels();
        }

        throw err;
      }
    },
    [chartId, user?.id, optimistic, fetchLabels]
  );

  // Remove a label
  const removeLabel = useCallback(
    async (pointId: string) => {
      if (!user?.id || !chartId) return;

      // Optimistic update
      if (optimistic) {
        setLabelRecords((prev) => prev.filter((r) => r.point_id !== pointId));
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: deleteError } = await (supabase as any)
          .from('chart_labels')
          .delete()
          .eq('chart_id', chartId)
          .eq('point_id', pointId)
          .eq('created_by', user.id);

        if (deleteError) {
          throw deleteError;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove label';
        logger.error('Error removing chart label', {
          error: message,
          source: 'useChartLabels',
          details: { chartId, pointId, userId: user?.id },
        });

        // Rollback optimistic update on error
        if (optimistic) {
          await fetchLabels();
        }

        throw err;
      }
    },
    [chartId, user?.id, optimistic, fetchLabels]
  );

  // Debounced handler compatible with FmLineChart onLabelChange
  const handleLabelChange = useCallback(
    (pointId: string, label: string | undefined) => {
      // Clear any pending update for this point
      const existingTimeout = pendingUpdates.get(pointId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Immediate optimistic update for UI responsiveness
      if (optimistic) {
        if (label) {
          setLabelRecords((prev) => {
            const existing = prev.find((r) => r.point_id === pointId);
            if (existing) {
              return prev.map((r) => (r.point_id === pointId ? { ...r, label } : r));
            }
            return [
              ...prev,
              {
                id: `temp-${pointId}`,
                chart_id: chartId,
                point_id: pointId,
                label,
                marker_color: null,
                metadata: {},
                created_by: user?.id || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ];
          });
        } else {
          setLabelRecords((prev) => prev.filter((r) => r.point_id !== pointId));
        }
      }

      // Debounced database update
      const timeout = setTimeout(async () => {
        try {
          if (label) {
            await setLabel(pointId, label);
          } else {
            await removeLabel(pointId);
          }
        } catch {
          // Error already logged in setLabel/removeLabel
        }
        setPendingUpdates((prev) => {
          const next = new Map(prev);
          next.delete(pointId);
          return next;
        });
      }, debounceMs);

      setPendingUpdates((prev) => new Map(prev).set(pointId, timeout));
    },
    [chartId, user?.id, debounceMs, optimistic, setLabel, removeLabel, pendingUpdates]
  );

  // Cleanup pending updates on unmount
  useEffect(() => {
    return () => {
      pendingUpdates.forEach((timeout) => clearTimeout(timeout));
    };
  }, [pendingUpdates]);

  return {
    labels,
    labelRecords,
    setLabel,
    removeLabel,
    handleLabelChange,
    isLoading,
    error,
    refresh: fetchLabels,
  };
}

/**
 * Chart ID constants for type safety
 */
export const CHART_IDS = {
  PAGE_VIEWS: 'page_views_chart',
  FUNNEL_CONVERSION: 'funnel_conversion_chart',
  PERFORMANCE_METRICS: 'performance_metrics_chart',
  REVENUE: 'revenue_chart',
  SESSIONS: 'sessions_chart',
} as const;

export type ChartId = (typeof CHART_IDS)[keyof typeof CHART_IDS];
