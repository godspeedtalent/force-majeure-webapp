import { useState, useCallback } from 'react';
import { logger } from '@/shared';
import { MobileCardFieldConfig } from '../components/mobile/types';

interface MobileGridPersistedState {
  fieldConfig: MobileCardFieldConfig[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  pageSize: number;
}

interface UseMobileGridPersistenceOptions {
  storageKey: string;
  enabled?: boolean;
}

export interface UseMobileGridPersistenceReturn {
  loadState: () => MobileGridPersistedState | null;
  saveFieldConfig: (config: MobileCardFieldConfig[]) => void;
  saveSortState: (column: string | null, direction: 'asc' | 'desc') => void;
  clearState: () => void;
  isLoaded: boolean;
}

/**
 * Hook to persist mobile grid state to localStorage
 * Saves field configuration, sorting, and page size
 */
export function useMobileGridPersistence({
  storageKey,
  enabled = true,
}: UseMobileGridPersistenceOptions): UseMobileGridPersistenceReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const fullKey = `mobile_grid_${storageKey}`;

  /**
   * Load state from localStorage
   */
  const loadState = useCallback((): MobileGridPersistedState | null => {
    if (!enabled) return null;

    try {
      const stored = localStorage.getItem(fullKey);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      setIsLoaded(true);
      return parsed;
    } catch (error) {
      logger.error('Failed to load mobile grid state', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'useMobileGridPersistence.loadState',
        details: { fullKey },
      });
      return null;
    }
  }, [fullKey, enabled]);

  /**
   * Save field config to localStorage
   */
  const saveFieldConfig = useCallback(
    (config: MobileCardFieldConfig[]) => {
      if (!enabled) return;

      try {
        const existing = loadState() || {};
        const updated = { ...existing, fieldConfig: config };
        localStorage.setItem(fullKey, JSON.stringify(updated));
      } catch (error) {
        logger.error('Failed to save mobile grid field config', {
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'useMobileGridPersistence.saveFieldConfig',
          details: { fullKey },
        });
      }
    },
    [fullKey, enabled, loadState]
  );

  /**
   * Save sort state to localStorage
   */
  const saveSortState = useCallback(
    (column: string | null, direction: 'asc' | 'desc') => {
      if (!enabled) return;

      try {
        const existing = loadState() || {};
        const updated = { ...existing, sortColumn: column, sortDirection: direction };
        localStorage.setItem(fullKey, JSON.stringify(updated));
      } catch (error) {
        logger.error('Failed to save mobile grid sort state', {
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'useMobileGridPersistence.saveSortState',
          details: { fullKey },
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
      logger.error('Failed to clear mobile grid state', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'useMobileGridPersistence.clearState',
        details: { fullKey },
      });
    }
  }, [fullKey, enabled]);

  return {
    loadState,
    saveFieldConfig,
    saveSortState,
    clearState,
    isLoaded,
  };
}
