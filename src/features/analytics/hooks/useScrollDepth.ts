/**
 * useScrollDepth Hook
 *
 * Tracks scroll depth on a page and returns the current max depth.
 * Useful for components that need to read scroll depth independently.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseScrollDepthOptions {
  /** Throttle interval in ms (default: 100) */
  throttleMs?: number;
  /** Enable/disable tracking (default: true) */
  enabled?: boolean;
}

interface ScrollDepthResult {
  /** Current max scroll depth (0-100) */
  maxDepth: number;
  /** Current scroll position (0-100) */
  currentDepth: number;
  /** Reset the max depth */
  reset: () => void;
}

/**
 * Hook for tracking scroll depth
 */
export function useScrollDepth({
  throttleMs = 100,
  enabled = true,
}: UseScrollDepthOptions = {}): ScrollDepthResult {
  const [maxDepth, setMaxDepth] = useState(0);
  const [currentDepth, setCurrentDepth] = useState(0);
  const lastUpdate = useRef<number>(0);

  const calculateDepth = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return 100;
    return Math.min(100, Math.round((window.scrollY / scrollHeight) * 100));
  }, []);

  const handleScroll = useCallback(() => {
    if (!enabled) return;

    const now = Date.now();
    if (now - lastUpdate.current < throttleMs) return;
    lastUpdate.current = now;

    const depth = calculateDepth();
    setCurrentDepth(depth);
    setMaxDepth(prev => Math.max(prev, depth));
  }, [enabled, throttleMs, calculateDepth]);

  const reset = useCallback(() => {
    setMaxDepth(0);
    setCurrentDepth(calculateDepth());
  }, [calculateDepth]);

  useEffect(() => {
    if (!enabled) return;

    // Initial calculation
    const initialDepth = calculateDepth();
    setCurrentDepth(initialDepth);
    setMaxDepth(initialDepth);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [enabled, handleScroll, calculateDepth]);

  return { maxDepth, currentDepth, reset };
}
