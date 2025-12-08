import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/shared/services/logger';

interface UseDebouncedSaveOptions<T> {
  /** The save function to call when debounce timer completes */
  saveFn: (data: T) => Promise<void>;
  /** Debounce delay in milliseconds (default: 5000ms = 5 seconds) */
  delay?: number;
  /** Enable/disable auto-save (default: true) */
  enabled?: boolean;
}

/**
 * Hook for debounced auto-save with navigation cleanup
 *
 * Features:
 * - Debounces save operations by specified delay (default 5s)
 * - Automatically flushes pending saves when component unmounts
 * - Automatically flushes pending saves when navigating away
 * - Returns trigger function to manually trigger save
 *
 * @example
 * ```tsx
 * const saveData = async (data: MyData) => {
 *   await supabase.from('table').update(data).eq('id', id);
 * };
 *
 * const { triggerSave, flushSave, hasPendingSave } = useDebouncedSave({
 *   saveFn: saveData,
 *   delay: 5000,
 * });
 *
 * // Trigger save on input change
 * const handleChange = (value: string) => {
 *   setName(value);
 *   triggerSave({ name: value });
 * };
 * ```
 */
export function useDebouncedSave<T>({
  saveFn,
  delay = 5000,
  enabled = true,
}: UseDebouncedSaveOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<T | null>(null);
  const isSavingRef = useRef(false);
  const navigate = useNavigate();

  /**
   * Flush any pending save immediately
   */
  const flushSave = useCallback(async () => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Execute pending save if exists
    if (pendingDataRef.current && !isSavingRef.current) {
      const dataToSave = pendingDataRef.current;
      pendingDataRef.current = null;
      isSavingRef.current = true;

      try {
        await saveFn(dataToSave);
        logger.info('Flushed pending save', { context: 'useDebouncedSave' });
      } catch (error) {
        logger.error('Error flushing pending save', {
          error: error instanceof Error ? error.message : 'Unknown',
          context: 'useDebouncedSave',
        });
      } finally {
        isSavingRef.current = false;
      }
    }
  }, [saveFn, enabled]);

  /**
   * Trigger a debounced save
   */
  const triggerSave = useCallback(
    (data: T) => {
      if (!enabled) return;

      // Store pending data
      pendingDataRef.current = data;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(async () => {
        if (pendingDataRef.current && !isSavingRef.current) {
          const dataToSave = pendingDataRef.current;
          pendingDataRef.current = null;
          isSavingRef.current = true;

          try {
            await saveFn(dataToSave);
            logger.info('Auto-save completed', { context: 'useDebouncedSave' });
          } catch (error) {
            logger.error('Error during auto-save', {
              error: error instanceof Error ? error.message : 'Unknown',
              context: 'useDebouncedSave',
            });
          } finally {
            isSavingRef.current = false;
          }
        }
        timeoutRef.current = null;
      }, delay);
    },
    [saveFn, delay, enabled]
  );

  /**
   * Cancel any pending save
   */
  const cancelSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingDataRef.current = null;
  }, []);

  // Cleanup: flush pending saves on unmount or navigation
  useEffect(() => {
    return () => {
      // Flush any pending save when component unmounts
      if (pendingDataRef.current && !isSavingRef.current) {
        // Use synchronous approach for unmount cleanup
        const dataToSave = pendingDataRef.current;
        pendingDataRef.current = null;

        // Fire and forget - best effort save on unmount
        saveFn(dataToSave).catch(error => {
          logger.error('Error saving on unmount', {
            error: error instanceof Error ? error.message : 'Unknown',
            context: 'useDebouncedSave',
          });
        });
      }

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [saveFn]);

  // Listen for navigation events (beforeunload for external navigation)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingDataRef.current) {
        // Attempt to flush save before leaving
        flushSave();

        // Show warning to user
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [flushSave]);

  return {
    /** Trigger a debounced save */
    triggerSave,
    /** Flush any pending save immediately */
    flushSave,
    /** Cancel any pending save */
    cancelSave,
    /** Whether there is a pending save */
    hasPendingSave: () => pendingDataRef.current !== null,
  };
}
