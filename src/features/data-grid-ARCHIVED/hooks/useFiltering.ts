import { useState, useCallback } from 'react';
import { FilteringState, FilteringOptions, ColumnDef } from '../types';

/**
 * Hook for managing data grid filtering state
 */
export function useFiltering(options?: FilteringOptions): FilteringState {
  const [searchQuery, setSearchQueryState] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const setColumnFilter = useCallback((columnKey: string, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQueryState('');
    setColumnFilters({});
  }, []);

  const filterData = useCallback(<T,>(data: T[], columns: ColumnDef<T>[]): T[] => {
    let filtered = [...data];

    // Apply global search
    if (searchQuery && options?.searchable) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((row) =>
        columns.some((col) => {
          const value = row[col.key as keyof T];
          return value?.toString().toLowerCase().includes(query);
        })
      );
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        const query = value.toLowerCase();
        filtered = filtered.filter((row) => {
          const cellValue = row[key as keyof T];
          return cellValue?.toString().toLowerCase().includes(query);
        });
      }
    });

    return filtered;
  }, [searchQuery, columnFilters, options?.searchable]);

  return {
    searchQuery,
    columnFilters,
    setSearchQuery,
    setColumnFilter,
    clearFilters,
    filterData,
  };
}
