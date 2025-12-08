import { useState, useRef, useEffect } from 'react';

export interface DataGridSelectionState {
  selectedRows: Set<number>;
  lastSelectedIndex: number | null;
  isDragMode: boolean;
  dragStartRow: number | null;
  dragCurrentRow: number | null;
}

export interface DataGridSelectionActions {
  setSelectedRows: (rows: Set<number>) => void;
  setLastSelectedIndex: (index: number | null) => void;
  handleSelectAll: (
    checked: boolean,
    pageSize: number,
    currentPage: number,
    totalRows: number
  ) => void;
  handleRowSelect: (
    rowIndex: number,
    checked: boolean,
    shiftKey: boolean
  ) => void;
  clearSelection: () => void;
  startDragSelect: (rowIndex: number) => void;
  updateDragSelect: (rowIndex: number) => void;
  endDragSelect: () => void;
  getDragBoxStyle: () => React.CSSProperties | null;
}

export interface UseDataGridSelectionReturn
  extends DataGridSelectionState,
    DataGridSelectionActions {
  rowRefs: React.MutableRefObject<Map<number, HTMLTableRowElement>>;
  dragTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

/**
 * Hook to manage row selection in the DataGrid
 * Supports single select, multi-select, shift-click range select, and drag-to-select
 */
export function useDataGridSelection(): UseDataGridSelectionReturn {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null
  );
  const [isDragMode, setIsDragMode] = useState(false);
  const [dragStartRow, setDragStartRow] = useState<number | null>(null);
  const [dragCurrentRow, setDragCurrentRow] = useState<number | null>(null);
  const dragTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (dragTimerRef.current) {
        clearTimeout(dragTimerRef.current);
      }
    };
  }, []);

  // Handle select all
  const handleSelectAll = (
    checked: boolean,
    pageSizeVal: number,
    currentPageVal: number,
    totalRows: number
  ) => {
    if (checked) {
      const allIndices = new Set(
        Array.from(
          {
            length: Math.min(
              pageSizeVal,
              totalRows - (currentPageVal - 1) * pageSizeVal
            ),
          },
          (_, idx) => (currentPageVal - 1) * pageSizeVal + idx
        )
      );
      setSelectedRows(allIndices);
    } else {
      setSelectedRows(new Set());
    }
  };

  // Handle single row selection
  const handleRowSelect = (
    rowIndex: number,
    checked: boolean,
    shiftKey: boolean
  ) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev);

      if (shiftKey && lastSelectedIndex !== null) {
        // Range selection with shift key
        const start = Math.min(lastSelectedIndex, rowIndex);
        const end = Math.max(lastSelectedIndex, rowIndex);

        for (let i = start; i <= end; i++) {
          if (checked) {
            newSelection.add(i);
          } else {
            newSelection.delete(i);
          }
        }
      } else {
        // Single row selection
        if (checked) {
          newSelection.add(rowIndex);
        } else {
          newSelection.delete(rowIndex);
        }
      }

      return newSelection;
    });

    setLastSelectedIndex(rowIndex);
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedRows(new Set());
    setLastSelectedIndex(null);
  };

  // Drag-to-select handlers
  const startDragSelect = (rowIndex: number) => {
    dragTimerRef.current = setTimeout(() => {
      setIsDragMode(true);
      setDragStartRow(rowIndex);
      setDragCurrentRow(rowIndex);
      setSelectedRows(new Set([rowIndex]));
    }, 200); // 200ms delay before drag mode activates
  };

  const updateDragSelect = (rowIndex: number) => {
    if (isDragMode && dragStartRow !== null) {
      const start = Math.min(dragStartRow, rowIndex);
      const end = Math.max(dragStartRow, rowIndex);
      const selection = new Set<number>();

      for (let i = start; i <= end; i++) {
        selection.add(i);
      }

      setSelectedRows(selection);
      setDragCurrentRow(rowIndex);
    }
  };

  const endDragSelect = () => {
    if (dragTimerRef.current) {
      clearTimeout(dragTimerRef.current);
      dragTimerRef.current = null;
    }
    setIsDragMode(false);
    setDragStartRow(null);
    setDragCurrentRow(null);
  };

  // Calculate drag selection box position
  const getDragBoxStyle = (): React.CSSProperties | null => {
    if (!isDragMode || dragStartRow === null || dragCurrentRow === null)
      return null;

    const startRowEl = rowRefs.current.get(dragStartRow);
    const endRowEl = rowRefs.current.get(dragCurrentRow);

    if (!startRowEl || !endRowEl) return null;

    const startRect = startRowEl.getBoundingClientRect();
    const endRect = endRowEl.getBoundingClientRect();

    const top = Math.min(startRect.top, endRect.top);
    const bottom = Math.max(startRect.bottom, endRect.bottom);
    const height = bottom - top;

    return {
      position: 'fixed' as const,
      top: `${top}px`,
      left: 0,
      right: 0,
      height: `${height}px`,
      border: '2px solid rgb(var(--fm-gold))',
      borderRadius: '4px',
      pointerEvents: 'none' as const,
      zIndex: 10,
      backgroundColor: 'rgba(var(--fm-gold), 0.05)',
    };
  };

  return {
    // State
    selectedRows,
    lastSelectedIndex,
    isDragMode,
    dragStartRow,
    dragCurrentRow,

    // Actions
    setSelectedRows,
    setLastSelectedIndex,
    handleSelectAll,
    handleRowSelect,
    clearSelection,
    startDragSelect,
    updateDragSelect,
    endDragSelect,
    getDragBoxStyle,

    // Refs
    rowRefs,
    dragTimerRef,
  };
}
