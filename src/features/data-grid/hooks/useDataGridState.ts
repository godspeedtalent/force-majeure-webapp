import { useState, useEffect } from 'react';

/** Sort specification for a single column */
export interface SortSpec {
  column: string;
  direction: 'asc' | 'desc';
}

export interface DataGridState {
  // Sorting (legacy single-column for backwards compatibility)
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  // Multi-column sorting
  sortSpecs: SortSpec[];

  // Pagination
  currentPage: number;

  // Editing
  editingCell: { rowIndex: number; columnKey: string } | null;
  editValue: string;

  // Creating
  isCreatingRow: boolean;
  newRowData: Record<string, any>;

  // UI State
  contextMenuOpenRow: number | null;
  hoveredColumn: string | null;
}

export interface DataGridStateActions {
  // Sorting
  setSortColumn: (column: string | null) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
  handleSort: (columnKey: string, addToMultiSort?: boolean) => void;
  setSortSpecs: (specs: SortSpec[]) => void;
  clearSort: () => void;
  /** Get the sort order index for a column (1-based), or null if not sorted */
  getSortIndex: (columnKey: string) => number | null;
  /** Get the sort direction for a column, or null if not sorted */
  getSortDirection: (columnKey: string) => 'asc' | 'desc' | null;

  // Pagination
  setCurrentPage: (page: number) => void;

  // Editing
  setEditingCell: (
    cell: { rowIndex: number; columnKey: string } | null
  ) => void;
  setEditValue: (value: string) => void;
  startEditing: (
    rowIndex: number,
    columnKey: string,
    initialValue: string
  ) => void;
  stopEditing: () => void;

  // Creating
  setIsCreatingRow: (isCreating: boolean) => void;
  setNewRowData: (data: Record<string, any>) => void;
  startCreating: () => void;
  stopCreating: () => void;

  // UI State
  setContextMenuOpenRow: (row: number | null) => void;
  setHoveredColumn: (column: string | null) => void;
}

export interface UseDataGridStateOptions {
  dataLength: number;
}

export interface UseDataGridStateReturn
  extends DataGridState,
    DataGridStateActions {}

/**
 * Hook to manage all internal state for the DataGrid
 * Handles sorting, pagination, editing, and UI state
 */
export function useDataGridState({
  dataLength,
}: UseDataGridStateOptions): UseDataGridStateReturn {
  // Multi-column sorting state
  const [sortSpecs, setSortSpecs] = useState<SortSpec[]>([]);

  // Legacy single-column computed values for backwards compatibility
  const sortColumn = sortSpecs.length > 0 ? sortSpecs[0].column : null;
  const sortDirection = sortSpecs.length > 0 ? sortSpecs[0].direction : 'asc';

  // Legacy setters that update sortSpecs
  const setSortColumn = (column: string | null) => {
    if (column === null) {
      setSortSpecs([]);
    } else {
      setSortSpecs([{ column, direction: 'asc' }]);
    }
  };

  const setSortDirection = (direction: 'asc' | 'desc') => {
    if (sortSpecs.length > 0) {
      setSortSpecs([{ ...sortSpecs[0], direction }]);
    }
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Editing state
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    columnKey: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Creating state
  const [isCreatingRow, setIsCreatingRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});

  // UI state
  const [contextMenuOpenRow, setContextMenuOpenRow] = useState<number | null>(
    null
  );
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  // Reset page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [dataLength]);

  // Sort handler - supports multi-column sorting with Shift+Click
  const handleSort = (columnKey: string, addToMultiSort = false) => {
    const existingIndex = sortSpecs.findIndex(s => s.column === columnKey);

    if (addToMultiSort) {
      // Multi-column sort mode (Shift+Click)
      if (existingIndex >= 0) {
        // Column already in sort - toggle direction or remove if already desc
        const current = sortSpecs[existingIndex];
        if (current.direction === 'asc') {
          // Toggle to desc
          const newSpecs = [...sortSpecs];
          newSpecs[existingIndex] = { ...current, direction: 'desc' };
          setSortSpecs(newSpecs);
        } else {
          // Remove from sort
          setSortSpecs(sortSpecs.filter((_, i) => i !== existingIndex));
        }
      } else {
        // Add new column to sort
        setSortSpecs([...sortSpecs, { column: columnKey, direction: 'asc' }]);
      }
    } else {
      // Single-column sort mode (regular click)
      if (existingIndex === 0 && sortSpecs.length === 1) {
        // Same column, toggle direction
        setSortSpecs([{ column: columnKey, direction: sortDirection === 'asc' ? 'desc' : 'asc' }]);
      } else {
        // New column or replacing multi-sort with single sort
        setSortSpecs([{ column: columnKey, direction: 'asc' }]);
      }
    }
  };

  // Clear all sorting
  const clearSort = () => {
    setSortSpecs([]);
  };

  // Get sort index for a column (1-based for display)
  const getSortIndex = (columnKey: string): number | null => {
    const index = sortSpecs.findIndex(s => s.column === columnKey);
    return index >= 0 ? index + 1 : null;
  };

  // Get sort direction for a column
  const getSortDirection = (columnKey: string): 'asc' | 'desc' | null => {
    const spec = sortSpecs.find(s => s.column === columnKey);
    return spec?.direction ?? null;
  };

  // Editing helpers
  const startEditing = (
    rowIndex: number,
    columnKey: string,
    initialValue: string
  ) => {
    setEditingCell({ rowIndex, columnKey });
    setEditValue(initialValue);
  };

  const stopEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Creating helpers
  const startCreating = () => {
    setIsCreatingRow(true);
    setNewRowData({});
  };

  const stopCreating = () => {
    setIsCreatingRow(false);
    setNewRowData({});
  };

  return {
    // State
    sortColumn,
    sortDirection,
    sortSpecs,
    currentPage,
    editingCell,
    editValue,
    isCreatingRow,
    newRowData,
    contextMenuOpenRow,
    hoveredColumn,

    // Actions
    setSortColumn,
    setSortDirection,
    setSortSpecs,
    handleSort,
    clearSort,
    getSortIndex,
    getSortDirection,
    setCurrentPage,
    setEditingCell,
    setEditValue,
    startEditing,
    stopEditing,
    setIsCreatingRow,
    setNewRowData,
    startCreating,
    stopCreating,
    setContextMenuOpenRow,
    setHoveredColumn,
  };
}
