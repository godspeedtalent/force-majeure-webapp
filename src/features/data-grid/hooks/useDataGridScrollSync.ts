import { useRef, useState, useCallback, useEffect, RefObject } from 'react';

interface UseDataGridScrollSyncOptions {
  /** Dependencies that trigger scroll dimension recalculation */
  deps?: unknown[];
}

interface UseDataGridScrollSyncReturn {
  tableContainerRef: RefObject<HTMLDivElement>;
  stickyScrollRef: RefObject<HTMLDivElement>;
  scrollWidth: number;
  containerWidth: number;
  showStickyScrollbar: boolean;
  handleTableScroll: () => void;
  handleStickyScroll: () => void;
  /** Combine with parentRef for virtualization */
  setTableContainerRef: (el: HTMLDivElement | null) => void;
}

/**
 * Hook for synchronizing horizontal scroll between table and sticky scrollbar
 * Provides a sticky scrollbar that stays visible at the bottom of the viewport
 */
export function useDataGridScrollSync({
  deps = [],
}: UseDataGridScrollSyncOptions = {}): UseDataGridScrollSyncReturn {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const stickyScrollRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Update scroll width when table content changes
  useEffect(() => {
    const updateScrollDimensions = () => {
      if (tableContainerRef.current) {
        setScrollWidth(tableContainerRef.current.scrollWidth);
        setContainerWidth(tableContainerRef.current.clientWidth);
      }
    };

    updateScrollDimensions();

    // Use ResizeObserver to track size changes
    const resizeObserver = new ResizeObserver(updateScrollDimensions);
    if (tableContainerRef.current) {
      resizeObserver.observe(tableContainerRef.current);
    }

    return () => resizeObserver.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Sync scroll positions between table and sticky scrollbar
  const handleTableScroll = useCallback(() => {
    if (isSyncing || !tableContainerRef.current || !stickyScrollRef.current) return;
    setIsSyncing(true);
    stickyScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    requestAnimationFrame(() => setIsSyncing(false));
  }, [isSyncing]);

  const handleStickyScroll = useCallback(() => {
    if (isSyncing || !tableContainerRef.current || !stickyScrollRef.current) return;
    setIsSyncing(true);
    tableContainerRef.current.scrollLeft = stickyScrollRef.current.scrollLeft;
    requestAnimationFrame(() => setIsSyncing(false));
  }, [isSyncing]);

  const setTableContainerRef = useCallback((el: HTMLDivElement | null) => {
    (tableContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, []);

  const showStickyScrollbar = scrollWidth > containerWidth;

  return {
    tableContainerRef,
    stickyScrollRef,
    scrollWidth,
    containerWidth,
    showStickyScrollbar,
    handleTableScroll,
    handleStickyScroll,
    setTableContainerRef,
  };
}
