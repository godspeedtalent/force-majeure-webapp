import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseAutoScrollModeOptions {
  /** Whether auto-scroll is enabled */
  enabled: boolean;
  /** Duration in ms before auto-advancing (default: 10000) */
  duration?: number;
  /** Callback when timer completes */
  onComplete: () => void;
  /** Callback when auto-scroll is cancelled */
  onCancel?: () => void;
  /** Whether to skip certain indices (e.g., title card at index 0) */
  skipIndices?: number[];
  /** Current index to check against skipIndices */
  currentIndex?: number;
}

export interface UseAutoScrollModeReturn {
  /** Progress from 0 to 1 */
  progress: number;
  /** Whether auto-scroll is currently active */
  isActive: boolean;
  /** Parallax Y offset for image in vh (0 to 5, slides down) */
  imageParallaxY: number;
  /** Parallax X offset for image in vw (0 to 5, slides right) */
  imageParallaxX: number;
  /** Parallax Y offset for content in vh (0 to -5, slides up) */
  contentParallaxY: number;
  /** Cancel auto-scroll permanently */
  cancel: () => void;
  /** Reset timer (e.g., when index changes) */
  reset: () => void;
  /** Whether auto-scroll has been permanently cancelled */
  isCancelled: boolean;
}

/**
 * Hook for managing auto-scroll mode with progress tracking and parallax
 * Provides smooth progress updates using requestAnimationFrame
 */
export function useAutoScrollMode({
  enabled,
  duration = 10000,
  onComplete,
  onCancel,
  skipIndices = [0],
  currentIndex = 0,
}: UseAutoScrollModeOptions): UseAutoScrollModeReturn {
  const [progress, setProgress] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);

  // Use ref for onComplete to avoid recreating animate callback
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Check if current index should be skipped
  const shouldSkip = skipIndices.includes(currentIndex);

  // Determine if auto-scroll is active
  const isActive = enabled && !isCancelled && !shouldSkip;

  // Calculate parallax offsets based on progress (max 2vh/2vw)
  // Image: slides down (positive Y) and right (positive X) from top-left corner
  // Content: slides up (negative Y)
  const imageParallaxY = isActive ? progress * 2 : 0; // 0 to 2vh (down)
  const imageParallaxX = isActive ? progress * 2 : 0; // 0 to 2vw (right)
  const contentParallaxY = isActive ? progress * -2 : 0; // 0 to -2vh (up)

  // Animation loop using requestAnimationFrame
  // Use stable callback that reads from ref
  const animate = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const newProgress = Math.min(elapsed / duration, 1);

      setProgress(newProgress);

      if (newProgress >= 1) {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          // Use ref to get latest callback
          onCompleteRef.current();
        }
      } else {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    },
    [duration] // Only duration as dependency, not onComplete
  );

  // Start animation when becoming active
  useEffect(() => {
    if (isActive) {
      // Reset and start animation
      startTimeRef.current = null;
      hasCompletedRef.current = false;
      setProgress(0);
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      // Stop animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setProgress(0);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, animate]);

  // Reset timer when index changes (restart animation for new card)
  useEffect(() => {
    // Always reset state for new index
    startTimeRef.current = null;
    hasCompletedRef.current = false;
    setProgress(0);

    // Cancel existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Start fresh animation if active
    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps
  // We intentionally exclude isActive and animate to only trigger on index change

  // Cancel auto-scroll permanently
  const cancel = useCallback(() => {
    if (!isCancelled) {
      setIsCancelled(true);
      onCancel?.();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setProgress(0);
    }
  }, [isCancelled, onCancel]);

  // Reset timer (for manual use)
  const reset = useCallback(() => {
    if (!isCancelled && isActive) {
      startTimeRef.current = null;
      hasCompletedRef.current = false;
      setProgress(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [isCancelled, isActive, animate]);

  return {
    progress,
    isActive,
    imageParallaxY,
    imageParallaxX,
    contentParallaxY,
    cancel,
    reset,
    isCancelled,
  };
}
