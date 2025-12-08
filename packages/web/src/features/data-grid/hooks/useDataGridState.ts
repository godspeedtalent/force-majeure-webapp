import { useState, useEffect } from 'react';

export interface DataGridState {
  // Sorting
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';

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
  handleSort: (columnKey: string) => void;

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
  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  // Sort handler
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
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
    handleSort,
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
