import { useState, useMemo } from 'react';
import { DataGridColumn } from '../types';
import { SortSpec } from './useDataGridState';

/** Available filter operators */
export type FilterOperator =
  | 'contains'
  | 'equals'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'isEmpty'
  | 'isNotEmpty';

/** Filter specification with operator */
export interface ColumnFilter {
  value: string;
  operator: FilterOperator;
}

export interface DataGridFiltersState {
  searchQuery: string;
  /** Legacy simple string filters */
  columnFilters: Record<string, string>;
  /** Advanced filters with operators */
  advancedFilters: Record<string, ColumnFilter>;
}

export interface DataGridFiltersActions {
  setSearchQuery: (query: string) => void;
  setColumnFilters: (filters: Record<string, string>) => void;
  handleColumnFilter: (columnKey: string, value: string, operator?: FilterOperator) => void;
  setAdvancedFilter: (columnKey: string, filter: ColumnFilter | null) => void;
  clearFilters: () => void;
  clearColumnFilter: (columnKey: string) => void;
  /** Get the current filter for a column */
  getColumnFilter: (columnKey: string) => ColumnFilter | null;
}

export interface UseDataGridFiltersOptions<T> {
  data: T[];
  columns: DataGridColumn[];
  /** @deprecated Use sortSpecs for multi-column sorting */
  sortColumn?: string | null;
  /** @deprecated Use sortSpecs for multi-column sorting */
  sortDirection?: 'asc' | 'desc';
  /** Multi-column sorting specifications */
  sortSpecs?: SortSpec[];
}

export interface UseDataGridFiltersReturn<T>
  extends Omit<DataGridFiltersState, 'advancedFilters'>,
    DataGridFiltersActions {
  filteredData: T[];
  activeFilterCount: number;
  hasActiveFilters: boolean;
  advancedFilters: Record<string, ColumnFilter>;
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
  sortSpecs = [],
}: UseDataGridFiltersOptions<T>): UseDataGridFiltersReturn<T> {
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );
  const [advancedFilters, setAdvancedFiltersState] = useState<Record<string, ColumnFilter>>(
    {}
  );

  // Helper to apply a filter operator
  const applyFilterOperator = (
    cellValue: string,
    filterValue: string,
    operator: FilterOperator
  ): boolean => {
    const lowerCell = cellValue.toLowerCase();
    const lowerFilter = filterValue.toLowerCase();

    switch (operator) {
      case 'contains':
        return lowerCell.includes(lowerFilter);
      case 'equals':
        return lowerCell === lowerFilter;
      case 'startsWith':
        return lowerCell.startsWith(lowerFilter);
      case 'endsWith':
        return lowerCell.endsWith(lowerFilter);
      case 'greaterThan': {
        const numCell = parseFloat(cellValue);
        const numFilter = parseFloat(filterValue);
        if (!isNaN(numCell) && !isNaN(numFilter)) {
          return numCell > numFilter;
        }
        // For dates
        const dateCell = Date.parse(cellValue);
        const dateFilter = Date.parse(filterValue);
        if (!isNaN(dateCell) && !isNaN(dateFilter)) {
          return dateCell > dateFilter;
        }
        return lowerCell > lowerFilter;
      }
      case 'lessThan': {
        const numCell = parseFloat(cellValue);
        const numFilter = parseFloat(filterValue);
        if (!isNaN(numCell) && !isNaN(numFilter)) {
          return numCell < numFilter;
        }
        // For dates
        const dateCell = Date.parse(cellValue);
        const dateFilter = Date.parse(filterValue);
        if (!isNaN(dateCell) && !isNaN(dateFilter)) {
          return dateCell < dateFilter;
        }
        return lowerCell < lowerFilter;
      }
      case 'isEmpty':
        return cellValue.trim() === '' || cellValue === 'null' || cellValue === 'undefined';
      case 'isNotEmpty':
        return cellValue.trim() !== '' && cellValue !== 'null' && cellValue !== 'undefined';
      default:
        return lowerCell.includes(lowerFilter);
    }
  };

  // Apply all filters and sorting to data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Helper to get searchable string value from a row for a column
    const getSearchableValue = (row: T, col: DataGridColumn): string => {
      if (col.filterValue) {
        return col.filterValue(row);
      }
      const value = row[col.key];
      return value?.toString() ?? '';
    };

    // Apply universal search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(row =>
        columns.some(col => {
          const value = getSearchableValue(row, col);
          return value.toLowerCase().includes(query);
        })
      );
    }

    // Apply column filters (legacy simple filters)
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        // Check if there's an advanced filter for this column (which takes precedence)
        if (advancedFilters[key]) return;

        const query = value.toLowerCase();
        const col = columns.find(c => c.key === key);
        filtered = filtered.filter(row => {
          const cellValue = col ? getSearchableValue(row, col) : row[key]?.toString() ?? '';
          return cellValue.toLowerCase().includes(query);
        });
      }
    });

    // Apply advanced filters with operators
    Object.entries(advancedFilters).forEach(([key, filter]) => {
      if (filter && (filter.value || filter.operator === 'isEmpty' || filter.operator === 'isNotEmpty')) {
        const col = columns.find(c => c.key === key);
        filtered = filtered.filter(row => {
          const cellValue = col ? getSearchableValue(row, col) : row[key]?.toString() ?? '';
          return applyFilterOperator(cellValue, filter.value, filter.operator);
        });
      }
    });

    // Helper to compare two values for sorting
    const compareValues = (aVal: unknown, bVal: unknown, direction: 'asc' | 'desc'): number => {
      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return direction === 'asc' ? 1 : -1;
      if (bVal == null) return direction === 'asc' ? -1 : 1;

      // Handle different types
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      if (aVal instanceof Date && bVal instanceof Date) {
        return direction === 'asc'
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime();
      }

      // Handle date strings
      const aDate = Date.parse(String(aVal));
      const bDate = Date.parse(String(bVal));
      if (!isNaN(aDate) && !isNaN(bDate)) {
        return direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      // Default string comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return direction === 'asc' ? 1 : -1;
      return 0;
    };

    // Apply multi-column sorting (sortSpecs takes priority over legacy sortColumn)
    const effectiveSortSpecs = sortSpecs.length > 0
      ? sortSpecs
      : sortColumn
        ? [{ column: sortColumn, direction: sortDirection }]
        : [];

    if (effectiveSortSpecs.length > 0) {
      filtered.sort((a, b) => {
        for (const spec of effectiveSortSpecs) {
          const aVal = a[spec.column];
          const bVal = b[spec.column];
          const result = compareValues(aVal, bVal, spec.direction);
          if (result !== 0) return result;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, searchQuery, columns, columnFilters, advancedFilters, sortColumn, sortDirection, sortSpecs, applyFilterOperator]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    count += Object.values(columnFilters).filter(v => v).length;
    count += Object.values(advancedFilters).filter(f => f && (f.value || f.operator === 'isEmpty' || f.operator === 'isNotEmpty')).length;
    return count;
  }, [searchQuery, columnFilters, advancedFilters]);

  const hasActiveFilters = activeFilterCount > 0;

  // Update a specific column filter (with optional operator)
  const handleColumnFilter = (columnKey: string, value: string, operator?: FilterOperator) => {
    if (operator) {
      // Use advanced filter with operator
      setAdvancedFiltersState(prev => ({
        ...prev,
        [columnKey]: { value, operator },
      }));
      // Clear legacy filter for this column
      setColumnFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[columnKey];
        return newFilters;
      });
    } else {
      // Use legacy simple filter
      setColumnFilters(prev => ({
        ...prev,
        [columnKey]: value,
      }));
      // Clear advanced filter for this column
      setAdvancedFiltersState(prev => {
        const newFilters = { ...prev };
        delete newFilters[columnKey];
        return newFilters;
      });
    }
  };

  // Set advanced filter directly
  const setAdvancedFilter = (columnKey: string, filter: ColumnFilter | null) => {
    if (filter) {
      setAdvancedFiltersState(prev => ({
        ...prev,
        [columnKey]: filter,
      }));
      // Clear legacy filter
      setColumnFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[columnKey];
        return newFilters;
      });
    } else {
      setAdvancedFiltersState(prev => {
        const newFilters = { ...prev };
        delete newFilters[columnKey];
        return newFilters;
      });
    }
  };

  // Get current filter for a column
  const getColumnFilter = (columnKey: string): ColumnFilter | null => {
    if (advancedFilters[columnKey]) {
      return advancedFilters[columnKey];
    }
    if (columnFilters[columnKey]) {
      return { value: columnFilters[columnKey], operator: 'contains' };
    }
    return null;
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setColumnFilters({});
    setAdvancedFiltersState({});
  };

  // Clear a specific column filter
  const clearColumnFilter = (columnKey: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[columnKey];
      return newFilters;
    });
    setAdvancedFiltersState(prev => {
      const newFilters = { ...prev };
      delete newFilters[columnKey];
      return newFilters;
    });
  };

  return {
    // State
    searchQuery,
    columnFilters,
    advancedFilters,

    // Actions
    setSearchQuery,
    setColumnFilters,
    handleColumnFilter,
    setAdvancedFilter,
    getColumnFilter,
    clearFilters,
    clearColumnFilter,

    // Computed values
    filteredData,
    activeFilterCount,
    hasActiveFilters,
  };
}
