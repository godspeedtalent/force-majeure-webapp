import { useState, useCallback } from 'react';
import { SortingState, SortingOptions } from '../types';

/**
 * Hook for managing data grid sorting state
 */
export function useSorting(options?: SortingOptions): SortingState {
  const [sortColumn, setSortColumn] = useState<string | null>(
    options?.defaultSort?.column || null
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    options?.defaultSort?.direction || 'asc'
  );

  const handleSort = useCallback((columnKey: string) => {
    if (sortColumn === columnKey) {
      // Toggle direction if same column
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      // New column, default to ascending
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  const clearSort = useCallback(() => {
    setSortColumn(null);
    setSortDirection('asc');
  }, []);

  const sortData = useCallback(<T,>(data: T[]): T[] => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn as keyof T];
      const bValue = b[sortColumn as keyof T];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [sortColumn, sortDirection]);

  return {
    sortColumn,
    sortDirection,
    handleSort,
    clearSort,
    sortData,
  };
}
