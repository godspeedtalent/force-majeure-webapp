import { useState, useCallback } from 'react';
import { logger } from '@/shared';

interface DataGridPersistedState {
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  columnFilters: Record<string, string>;
  pageSize: number;
  hiddenColumns?: string[];
}

interface UseDataGridPersistenceOptions {
  storageKey: string; // Unique key for this grid's state
  enabled?: boolean;
}

export interface UseDataGridPersistenceReturn {
  loadState: () => DataGridPersistedState | null;
  saveState: (state: Partial<DataGridPersistedState>) => void;
  clearState: () => void;
  isLoaded: boolean;
}

/**
 * Hook to persist DataGrid state to localStorage
 * Saves sorting, filters, page size, and hidden columns
 */
export function useDataGridPersistence({
  storageKey,
  enabled = true,
}: UseDataGridPersistenceOptions): UseDataGridPersistenceReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const fullKey = `datagrid_${storageKey}`;

  /**
   * Load state from localStorage
   */
  const loadState = useCallback((): DataGridPersistedState | null => {
    if (!enabled) return null;

    try {
      const stored = localStorage.getItem(fullKey);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      setIsLoaded(true);
      return parsed;
    } catch (error) {
      logger.error('Failed to load DataGrid state', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'loadState',
        details: { fullKey, error }
      });
      return null;
    }
  }, [fullKey, enabled]);

  /**
   * Save state to localStorage
   */
  const saveState = useCallback(
    (state: Partial<DataGridPersistedState>) => {
      if (!enabled) return;

      try {
        // Load existing state and merge with new values
        const existing = loadState() || {};
        const updated = { ...existing, ...state };

        localStorage.setItem(fullKey, JSON.stringify(updated));
      } catch (error) {
        logger.error('Failed to save DataGrid state', {
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'saveState',
          details: { fullKey, error }
        });
      }
    },
    [fullKey, enabled, loadState]
  );

  /**
   * Clear persisted state
   */
  const clearState = useCallback(() => {
    if (!enabled) return;

    try {
      localStorage.removeItem(fullKey);
      setIsLoaded(false);
    } catch (error) {
      logger.error('Failed to clear DataGrid state', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'clearState',
        details: { fullKey, error }
      });
    }
  }, [fullKey, enabled]);

  return {
    loadState,
    saveState,
    clearState,
    isLoaded,
  };
}
