import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseMobileSwipeNavigationOptions {
  /** Total number of items in the swipe view */
  totalItems: number;
  /** Initial index to start at */
  initialIndex?: number;
  /** Callback when index changes */
  onIndexChange?: (index: number) => void;
  /** Enable haptic feedback on index change */
  hapticFeedback?: boolean;
  /** Auto-advance delay in ms (0 to disable) */
  autoAdvanceDelay?: number;
  /** Callback when auto-advance is triggered */
  onAutoAdvance?: () => void;
}

export interface UseMobileSwipeNavigationReturn {
  /** Current active index */
  currentIndex: number;
  /** Set the current index directly */
  setCurrentIndex: (index: number) => void;
  /** Navigate to the next item */
  goToNext: () => void;
  /** Navigate to the previous item */
  goToPrevious: () => void;
  /** Navigate to a specific index */
  goToIndex: (index: number) => void;
  /** Whether there is a next item */
  hasNext: boolean;
  /** Whether there is a previous item */
  hasPrevious: boolean;
  /** Cancel any pending auto-advance */
  cancelAutoAdvance: () => void;
  /** Whether auto-advance is currently scheduled */
  isAutoAdvancePending: boolean;
  /** Start or restart the auto-advance timer */
  startAutoAdvance: () => void;
}

/**
 * Hook for managing mobile swipe navigation state
 * Handles index tracking, navigation helpers, haptic feedback, and auto-advance
 */
export function useMobileSwipeNavigation(
  options: UseMobileSwipeNavigationOptions
): UseMobileSwipeNavigationReturn {
  const {
    totalItems,
    initialIndex = 0,
    onIndexChange,
    hapticFeedback = true,
    autoAdvanceDelay = 0,
    onAutoAdvance,
  } = options;

  const [currentIndex, setCurrentIndexState] = useState(initialIndex);
  const [isAutoAdvancePending, setIsAutoAdvancePending] = useState(false);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasUserInteractedRef = useRef(false);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(() => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [hapticFeedback]);

  // Cancel auto-advance timer
  const cancelAutoAdvance = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setIsAutoAdvancePending(false);
  }, []);

  // Set current index with haptic feedback
  const setCurrentIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalItems) return;
      if (index === currentIndex) return;

      // Mark that user has interacted
      hasUserInteractedRef.current = true;
      cancelAutoAdvance();

      setCurrentIndexState(index);
      triggerHaptic();
      onIndexChange?.(index);
    },
    [totalItems, currentIndex, cancelAutoAdvance, triggerHaptic, onIndexChange]
  );

  // Navigate to next item
  const goToNext = useCallback(() => {
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, totalItems, setCurrentIndex]);

  // Navigate to previous item
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex, setCurrentIndex]);

  // Navigate to specific index
  const goToIndex = useCallback(
    (index: number) => {
      setCurrentIndex(index);
    },
    [setCurrentIndex]
  );

  // Start auto-advance timer
  const startAutoAdvance = useCallback(() => {
    if (autoAdvanceDelay <= 0 || hasUserInteractedRef.current) return;

    cancelAutoAdvance();
    setIsAutoAdvancePending(true);

    autoAdvanceTimerRef.current = setTimeout(() => {
      if (!hasUserInteractedRef.current && currentIndex < totalItems - 1) {
        setCurrentIndexState(prev => {
          const next = prev + 1;
          if (next < totalItems) {
            triggerHaptic();
            onIndexChange?.(next);
            onAutoAdvance?.();
            return next;
          }
          return prev;
        });
      }
      setIsAutoAdvancePending(false);
    }, autoAdvanceDelay);
  }, [
    autoAdvanceDelay,
    currentIndex,
    totalItems,
    cancelAutoAdvance,
    triggerHaptic,
    onIndexChange,
    onAutoAdvance,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  return {
    currentIndex,
    setCurrentIndex,
    goToNext,
    goToPrevious,
    goToIndex,
    hasNext: currentIndex < totalItems - 1,
    hasPrevious: currentIndex > 0,
    cancelAutoAdvance,
    isAutoAdvancePending,
    startAutoAdvance,
  };
}
