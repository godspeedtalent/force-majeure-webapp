import { useState, useCallback, useEffect } from 'react';
import { SelectionState, SelectionOptions } from '../types';

/**
 * Hook for managing data grid row selection state
 */
export function useSelection(
  totalItems: number,
  options?: SelectionOptions
): SelectionState {
  const enabled = options?.enabled ?? false;
  const mode = options?.mode || 'multiple';

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  // Notify parent of selection changes
  useEffect(() => {
    if (options?.onSelectionChange) {
      options.onSelectionChange(selectedRows);
    }
  }, [selectedRows, options?.onSelectionChange]);

  const toggleRow = useCallback((index: number, event?: React.MouseEvent) => {
    setSelectedRows((prev) => {
      const newSelection = new Set(prev);

      // Handle shift-select (range selection) in multiple mode
      if (event?.shiftKey && lastSelectedIndex !== null && mode === 'multiple') {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        for (let i = start; i <= end; i++) {
          newSelection.add(i);
        }
        return newSelection;
      }

      // Single mode: clear previous selection
      if (mode === 'single') {
        newSelection.clear();
        newSelection.add(index);
      } else {
        // Multiple mode: toggle selection
        if (newSelection.has(index)) {
          newSelection.delete(index);
        } else {
          newSelection.add(index);
        }
      }

      setLastSelectedIndex(index);
      return newSelection;
    });
  }, [lastSelectedIndex, mode]);

  const selectAll = useCallback(() => {
    if (mode === 'multiple') {
      const allIndices = new Set<number>();
      for (let i = 0; i < totalItems; i++) {
        allIndices.add(i);
      }
      setSelectedRows(allIndices);
    }
  }, [totalItems, mode]);

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set());
    setLastSelectedIndex(null);
  }, []);

  const isAllSelected = useCallback((totalRows: number): boolean => {
    if (totalRows === 0) return false;
    return selectedRows.size === totalRows;
  }, [selectedRows]);

  const getSelectedData = useCallback(<T,>(data: T[]): T[] => {
    return Array.from(selectedRows)
      .filter((index) => index < data.length)
      .map((index) => data[index]);
  }, [selectedRows]);

  return {
    selectedRows,
    enabled,
    mode,
    lastSelectedIndex,
    toggleRow,
    selectAll,
    clearSelection,
    isAllSelected,
    getSelectedData,
  };
}
