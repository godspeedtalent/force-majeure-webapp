import { useState, useMemo } from 'react';
import { DataGridColumn } from '../types';

export interface DataGridFiltersState {
  searchQuery: string;
  columnFilters: Record<string, string>;
}

export interface DataGridFiltersActions {
  setSearchQuery: (query: string) => void;
  setColumnFilters: (filters: Record<string, string>) => void;
  handleColumnFilter: (columnKey: string, value: string) => void;
  clearFilters: () => void;
  clearColumnFilter: (columnKey: string) => void;
}

export interface UseDataGridFiltersOptions<T> {
  data: T[];
  columns: DataGridColumn[];
  sortColumn?: string | null;
  sortDirection?: 'asc' | 'desc';
}

export interface UseDataGridFiltersReturn<T>
  extends DataGridFiltersState,
    DataGridFiltersActions {
  filteredData: T[];
  activeFilterCount: number;
  hasActiveFilters: boolean;
}

/**
 * Hook to manage search, filtering, and sorting logic for the DataGrid
 * Applies universal search, per-column filters, and column sorting
 */
export function useDataGridFilters<T extends Record<string, any>>({
  data,
  columns,
  sortColumn,
  sortDirection = 'asc',
}: UseDataGridFiltersOptions<T>): UseDataGridFiltersReturn<T> {
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );

  // Apply all filters and sorting to data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply universal search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(row =>
        columns.some(col => {
          const value = row[col.key];
          return value?.toString().toLowerCase().includes(query);
        })
      );
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        const query = value.toLowerCase();
        filtered = filtered.filter(row => {
          const cellValue = row[key];
          return cellValue?.toString().toLowerCase().includes(query);
        });
      }
    });

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        // Handle null/undefined values
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
        if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

        // Handle different types
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        if (aVal instanceof Date && bVal instanceof Date) {
          return sortDirection === 'asc'
            ? aVal.getTime() - bVal.getTime()
            : bVal.getTime() - aVal.getTime();
        }

        // Handle date strings
        const aDate = Date.parse(aVal);
        const bDate = Date.parse(bVal);
        if (!isNaN(aDate) && !isNaN(bDate)) {
          return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
        }

        // Default string comparison
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchQuery, columns, columnFilters, sortColumn, sortDirection]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    count += Object.values(columnFilters).filter(v => v).length;
    return count;
  }, [searchQuery, columnFilters]);

  const hasActiveFilters = activeFilterCount > 0;

  // Update a specific column filter
  const handleColumnFilter = (columnKey: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnKey]: value,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setColumnFilters({});
  };

  // Clear a specific column filter
  const clearColumnFilter = (columnKey: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[columnKey];
      return newFilters;
    });
  };

  return {
    // State
    searchQuery,
    columnFilters,

    // Actions
    setSearchQuery,
    setColumnFilters,
    handleColumnFilter,
    clearFilters,
    clearColumnFilter,

    // Computed values
    filteredData,
    activeFilterCount,
    hasActiveFilters,
  };
}
