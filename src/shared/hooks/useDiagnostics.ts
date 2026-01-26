import { useSyncExternalStore, useCallback } from 'react';
import {
  initDiagnostics,
  type DiagnosticSnapshot,
} from '@/shared/services/initDiagnostics';

/**
 * React hook to subscribe to diagnostics state
 * Uses useSyncExternalStore for proper React 18 concurrent mode support
 */
export function useDiagnostics() {
  const snapshot = useSyncExternalStore(
    // Subscribe function
    useCallback((callback: () => void) => initDiagnostics.subscribe(callback), []),
    // Get snapshot function
    () => initDiagnostics.getSnapshot(),
    // Get server snapshot (for SSR - return same as client)
    () => initDiagnostics.getSnapshot()
  );

  const copyReport = useCallback(() => {
    const report = initDiagnostics.getReport();
    navigator.clipboard.writeText(report);
    return report;
  }, []);

  const reset = useCallback(() => {
    initDiagnostics.reset();
  }, []);

  const refresh = useCallback(() => {
    // Force a re-render by getting a fresh snapshot
    return initDiagnostics.getSnapshot();
  }, []);

  const startHealthMonitor = useCallback((intervalMs?: number) => {
    initDiagnostics.startHealthMonitor(intervalMs);
  }, []);

  const stopHealthMonitor = useCallback(() => {
    initDiagnostics.stopHealthMonitor();
  }, []);

  return {
    ...snapshot,
    copyReport,
    reset,
    refresh,
    startHealthMonitor,
    stopHealthMonitor,
  };
}

/**
 * Get a specific metric duration from events
 */
export function getMetricDuration(
  events: DiagnosticSnapshot['events'],
  name: string
): number | null {
  const event = events.find(e => e.name === name && e.status === 'complete');
  if (!event?.details?.duration) return null;
  return event.details.duration as number;
}

/**
 * Get timing color based on duration
 */
export function getTimingColor(durationMs: number): 'green' | 'yellow' | 'red' {
  if (durationMs < 500) return 'green';
  if (durationMs < 2000) return 'yellow';
  return 'red';
}
