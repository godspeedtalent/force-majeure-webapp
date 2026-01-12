import { useState, useRef, useCallback, useEffect } from 'react';

interface UseDataGridColumnResizeOptions {
  initialWidths?: Record<string, number>;
  minWidth?: number;
  maxAutoFitWidth?: number;
}

interface UseDataGridColumnResizeReturn {
  columnWidths: Record<string, number>;
  resizingColumn: string | null;
  handleResizeStart: (columnKey: string, e: React.MouseEvent) => void;
  /** Auto-fit column width to content (call on double-click) */
  autoFitColumn: (columnKey: string) => void;
  /** Set column width directly */
  setColumnWidth: (columnKey: string, width: number) => void;
}

/**
 * Hook for managing data grid column resizing
 * Handles mouse drag events for column width adjustment
 */
export function useDataGridColumnResize({
  initialWidths = {},
  minWidth = 80,
  maxAutoFitWidth = 400,
}: UseDataGridColumnResizeOptions = {}): UseDataGridColumnResizeReturn {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(initialWidths);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  const handleResizeStart = useCallback((columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = columnWidths[columnKey] || 150;
  }, [columnWidths]);

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizingColumn) return;
      const diff = e.clientX - resizeStartX.current;
      const newWidth = Math.max(minWidth, resizeStartWidth.current + diff);
      setColumnWidths(prev => ({ ...prev, [resizingColumn]: newWidth }));
    },
    [resizingColumn, minWidth]
  );

  const handleResizeEnd = useCallback(() => setResizingColumn(null), []);

  // Auto-fit column width by measuring content
  const autoFitColumn = useCallback((columnKey: string) => {
    // Find all cells in this column and measure their content width
    const headerCell = document.querySelector(`[data-column-key="${columnKey}"]`) as HTMLElement;
    const dataCells = document.querySelectorAll(`[data-cell-column="${columnKey}"]`);

    let maxWidth = minWidth;

    // Measure header width
    if (headerCell) {
      const headerContent = headerCell.querySelector('.flex') as HTMLElement;
      if (headerContent) {
        maxWidth = Math.max(maxWidth, headerContent.scrollWidth + 32); // Add padding
      }
    }

    // Measure all data cells
    dataCells.forEach(cell => {
      const cellContent = cell.firstChild as HTMLElement;
      if (cellContent) {
        maxWidth = Math.max(maxWidth, cellContent.scrollWidth + 24); // Add padding
      }
    });

    // Clamp to max width
    const finalWidth = Math.min(maxWidth, maxAutoFitWidth);

    setColumnWidths(prev => ({ ...prev, [columnKey]: finalWidth }));
  }, [minWidth, maxAutoFitWidth]);

  // Set column width directly
  const setColumnWidth = useCallback((columnKey: string, width: number) => {
    setColumnWidths(prev => ({ ...prev, [columnKey]: Math.max(minWidth, width) }));
  }, [minWidth]);

  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
    return undefined;
  }, [resizingColumn, handleResizeMove, handleResizeEnd]);

  return {
    columnWidths,
    resizingColumn,
    handleResizeStart,
    autoFitColumn,
    setColumnWidth,
  };
}
