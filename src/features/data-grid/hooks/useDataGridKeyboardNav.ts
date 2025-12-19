import { useCallback, useRef } from 'react';

interface UseDataGridKeyboardNavProps {
  rows: any[];
  columns: any[];
  isEditing: boolean;
  editingCell: { rowIndex: number; columnKey: string } | null;
  onStartEditing: (rowIndex: number, columnKey: string) => void;
  onStopEditing: () => void;
  onNavigate?: (rowIndex: number, columnKey: string) => void;
}

export interface UseDataGridKeyboardNavReturn {
  handleTableKeyDown: (e: React.KeyboardEvent) => void;
  getFocusableCellProps: (
    rowIndex: number,
    columnKey: string
  ) => {
    tabIndex: number;
    onFocus: () => void;
    'data-row': number;
    'data-column': string;
    role: string;
    'aria-label': string;
  };
}

/**
 * Hook to manage keyboard navigation in DataGrid
 * Supports arrow keys, Enter to edit, Escape to cancel, Tab navigation
 */
export function useDataGridKeyboardNav({
  rows,
  columns,
  isEditing,
  editingCell,
  onStartEditing,
  onStopEditing,
  onNavigate,
}: UseDataGridKeyboardNavProps): UseDataGridKeyboardNavReturn {
  const focusedCellRef = useRef<{ rowIndex: number; columnKey: string } | null>(
    null
  );

  /**
   * Get the next/previous editable column
   */
  const getAdjacentColumn = (
    currentColumnKey: string,
    direction: 'next' | 'prev'
  ): string | null => {
    const editableColumns = columns.filter(col => col.editable);
    const currentIndex = editableColumns.findIndex(
      col => col.key === currentColumnKey
    );

    if (currentIndex === -1) return null;

    const nextIndex =
      direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex < 0 || nextIndex >= editableColumns.length) {
      return null;
    }

    return editableColumns[nextIndex].key;
  };

  /**
   * Handle keyboard navigation
   */
  const handleTableKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Don't handle if actively editing
      if (isEditing) return;

      const currentCell = focusedCellRef.current;
      if (!currentCell) return;

      const { rowIndex, columnKey } = currentCell;
      let newRowIndex = rowIndex;
      let newColumnKey = columnKey;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newRowIndex = Math.max(0, rowIndex - 1);
          break;

        case 'ArrowDown':
          e.preventDefault();
          newRowIndex = Math.min(rows.length - 1, rowIndex + 1);
          break;

        case 'ArrowLeft':
          e.preventDefault();
          const prevColumn = getAdjacentColumn(columnKey, 'prev');
          if (prevColumn) {
            newColumnKey = prevColumn;
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          const nextColumn = getAdjacentColumn(columnKey, 'next');
          if (nextColumn) {
            newColumnKey = nextColumn;
          }
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          const column = columns.find(c => c.key === columnKey);
          if (column?.editable) {
            onStartEditing(rowIndex, columnKey);
          }
          break;

        case 'Escape':
          e.preventDefault();
          onStopEditing();
          break;

        default:
          return; // Don't update focus for other keys
      }

      // Update focus if cell changed
      if (newRowIndex !== rowIndex || newColumnKey !== columnKey) {
        focusedCellRef.current = {
          rowIndex: newRowIndex,
          columnKey: newColumnKey,
        };
        onNavigate?.(newRowIndex, newColumnKey);

        // Focus the cell element
        const cellElement = document.querySelector(
          `[data-row="${newRowIndex}"][data-column="${newColumnKey}"]`
        ) as HTMLElement;
        cellElement?.focus();
      }
    },
    [isEditing, rows.length, columns, onStartEditing, onStopEditing, onNavigate]
  );

  /**
   * Get props for a focusable cell
   */
  const getFocusableCellProps = useCallback(
    (rowIndex: number, columnKey: string) => {
      const column = columns.find(c => c.key === columnKey);
      const isCurrentlyEditing =
        editingCell?.rowIndex === rowIndex &&
        editingCell?.columnKey === columnKey;

      return {
        tabIndex: isCurrentlyEditing ? -1 : 0,
        onFocus: () => {
          focusedCellRef.current = { rowIndex, columnKey };
        },
        'data-row': rowIndex,
        'data-column': columnKey,
        role: 'gridcell',
        'aria-label': `${column?.label || columnKey}, row ${rowIndex + 1}`,
      };
    },
    [columns, editingCell]
  );

  return {
    handleTableKeyDown,
    getFocusableCellProps,
  };
}
