import { useState, useRef, useCallback, useEffect } from 'react';

interface UseDataGridColumnResizeOptions {
  initialWidths?: Record<string, number>;
  minWidth?: number;
}

interface UseDataGridColumnResizeReturn {
  columnWidths: Record<string, number>;
  resizingColumn: string | null;
  handleResizeStart: (columnKey: string, e: React.MouseEvent) => void;
}

/**
 * Hook for managing data grid column resizing
 * Handles mouse drag events for column width adjustment
 */
export function useDataGridColumnResize({
  initialWidths = {},
  minWidth = 80,
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
  };
}
