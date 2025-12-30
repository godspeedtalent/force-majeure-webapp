import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface UseDataGridVirtualizationOptions {
  rowCount: number;
  estimateSize?: number;
  overscan?: number;
  enabled?: boolean;
}

export interface UseDataGridVirtualizationReturn {
  parentRef: React.MutableRefObject<HTMLDivElement | null>;
  virtualRows: any[];
  totalSize: number;
  isEnabled: boolean;
  getVirtualItemProps: (index: number) => {
    key: string;
    'data-index': number;
    ref?: (node: Element | null) => void;
    style: React.CSSProperties;
  };
}

/**
 * Hook to manage virtual scrolling for large datasets in DataGrid
 * Only virtualizes when enabled and row count exceeds threshold
 */
export function useDataGridVirtualization({
  rowCount,
  estimateSize = 48, // Default row height
  overscan = 10, // Number of items to render outside viewport
  enabled = true,
}: UseDataGridVirtualizationOptions): UseDataGridVirtualizationReturn {
  const parentRef = useRef<HTMLDivElement | null>(null);

  // Only enable virtualization for large datasets (>100 rows)
  const shouldVirtualize = enabled && rowCount > 100;

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    enabled: shouldVirtualize,
  });

  const virtualRows = shouldVirtualize ? rowVirtualizer.getVirtualItems() : [];
  const totalSize = shouldVirtualize ? rowVirtualizer.getTotalSize() : 0;

  const getVirtualItemProps = (index: number) => {
    const virtualRow = virtualRows.find(vr => vr.index === index);

    return {
      key: `row-${index}`,
      'data-index': index,
      ref: virtualRow ? rowVirtualizer.measureElement : undefined,
      style: virtualRow
        ? {
            position: 'absolute' as const,
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualRow.start}px)`,
          }
        : {},
    };
  };

  return {
    parentRef,
    virtualRows: shouldVirtualize
      ? virtualRows
      : Array.from({ length: rowCount }, (_, i) => ({ index: i })),
    totalSize,
    isEnabled: shouldVirtualize,
    getVirtualItemProps,
  };
}
