import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseInfiniteScrollOptions {
  /** Total number of items in the dataset */
  totalItems: number;
  /** Number of items to load per batch */
  batchSize?: number;
  /** Distance from bottom (in px) to trigger loading more */
  threshold?: number;
  /** Whether infinite scroll is enabled */
  enabled?: boolean;
}

export interface UseInfiniteScrollReturn {
  /** Number of items currently visible */
  visibleCount: number;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Load more items manually */
  loadMore: () => void;
  /** Reset to initial state */
  reset: () => void;
  /** Scroll event handler to attach to scrollable container */
  handleScroll: (e: React.UIEvent<HTMLElement>) => void;
  /** Ref callback for the scroll container */
  scrollContainerRef: (node: HTMLElement | null) => void;
  /** Whether currently loading more (for UI feedback) */
  isLoadingMore: boolean;
}

/**
 * Hook for infinite scroll functionality
 *
 * Tracks visible item count and loads more items as user scrolls
 * toward the bottom of the container.
 */
export function useInfiniteScroll({
  totalItems,
  batchSize = 25,
  threshold = 200,
  enabled = true,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  // Start with initial batch size
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerNodeRef = useRef<HTMLElement | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasMore = enabled && visibleCount < totalItems;

  // Load more items
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);

    // Small delay for smooth UX
    loadingTimeoutRef.current = setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + batchSize, totalItems));
      setIsLoadingMore(false);
    }, 100);
  }, [hasMore, isLoadingMore, batchSize, totalItems]);

  // Reset when total items or enabled state changes
  useEffect(() => {
    if (enabled) {
      setVisibleCount(Math.min(batchSize, totalItems));
    } else {
      // When disabled, show all items (pagination will handle it)
      setVisibleCount(totalItems);
    }
  }, [totalItems, enabled, batchSize]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Reset function
  const reset = useCallback(() => {
    setVisibleCount(batchSize);
    setIsLoadingMore(false);
  }, [batchSize]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    if (!enabled || !hasMore || isLoadingMore) return;

    const target = e.currentTarget;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

    if (scrollBottom < threshold) {
      loadMore();
    }
  }, [enabled, hasMore, isLoadingMore, threshold, loadMore]);

  // Ref callback for scroll container
  const scrollContainerRef = useCallback((node: HTMLElement | null) => {
    scrollContainerNodeRef.current = node;
  }, []);

  // Also check on window scroll for non-contained scenarios
  useEffect(() => {
    if (!enabled || !hasMore) return;

    const handleWindowScroll = () => {
      if (isLoadingMore) return;

      const scrollBottom = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;

      if (scrollBottom < threshold) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [enabled, hasMore, isLoadingMore, threshold, loadMore]);

  return {
    visibleCount,
    hasMore,
    loadMore,
    reset,
    handleScroll,
    scrollContainerRef,
    isLoadingMore,
  };
}
