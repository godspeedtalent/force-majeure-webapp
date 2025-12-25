/**
 * useSequentialFadeOut
 *
 * A reusable hook for creating sequential fade-out animations.
 * Allows multiple elements to fade out at different times with configurable durations.
 *
 * Usage:
 * ```tsx
 * const { elementStates, isActive, reset } = useSequentialFadeOut({
 *   trigger: isMockActive,
 *   elements: [
 *     { key: 'tooltip', visibleDuration: 3000, fadeDuration: 500 },
 *     { key: 'button', visibleDuration: 6000, fadeDuration: 1000 },
 *   ],
 * });
 *
 * // elementStates.tooltip.opacity - current opacity (1 -> 0)
 * // elementStates.tooltip.isVisible - whether element should render
 * // elementStates.button.opacity - current opacity
 * // elementStates.button.isVisible - whether element should render
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface FadeOutElement {
  /** Unique key to identify this element */
  key: string;
  /** How long the element stays fully visible (ms) */
  visibleDuration: number;
  /** How long the fade-out animation takes (ms) */
  fadeDuration: number;
}

export interface ElementState {
  /** Current opacity (1 = fully visible, 0 = hidden) */
  opacity: number;
  /** Whether the element should be rendered at all */
  isVisible: boolean;
  /** Whether the element is currently fading out */
  isFading: boolean;
}

export interface UseSequentialFadeOutOptions {
  /** When this becomes true, the fade sequence starts */
  trigger: boolean;
  /** Elements to fade out in sequence */
  elements: FadeOutElement[];
  /** Callback when all elements have faded out */
  onComplete?: () => void;
}

export interface UseSequentialFadeOutResult {
  /** State for each element, keyed by element key */
  elementStates: Record<string, ElementState>;
  /** Whether the fade sequence is currently active */
  isActive: boolean;
  /** Reset the fade sequence (useful for re-triggering) */
  reset: () => void;
}

export function useSequentialFadeOut({
  trigger,
  elements,
  onComplete,
}: UseSequentialFadeOutOptions): UseSequentialFadeOutResult {
  const prevTriggerRef = useRef(trigger);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const animationFramesRef = useRef<number[]>([]);
  const startTimeRef = useRef<number | null>(null);

  // Initialize element states
  const getInitialStates = useCallback((): Record<string, ElementState> => {
    const states: Record<string, ElementState> = {};
    for (const element of elements) {
      states[element.key] = {
        opacity: 1,
        isVisible: true,
        isFading: false,
      };
    }
    return states;
  }, [elements]);

  const [elementStates, setElementStates] = useState<Record<string, ElementState>>(() =>
    getInitialStates()
  );
  const [isActive, setIsActive] = useState(false);

  const reset = useCallback(() => {
    // Clear all timeouts and animation frames
    timeoutsRef.current.forEach(clearTimeout);
    animationFramesRef.current.forEach(cancelAnimationFrame);
    timeoutsRef.current = [];
    animationFramesRef.current = [];
    startTimeRef.current = null;

    setElementStates(getInitialStates());
    setIsActive(false);
  }, [getInitialStates]);

  // Animate opacity using requestAnimationFrame for smooth transitions
  const animateOpacity = useCallback(
    (key: string, fadeDuration: number, startTime: number) => {
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / fadeDuration, 1);
        const opacity = 1 - progress;

        setElementStates(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            opacity: Math.max(0, opacity),
            isFading: progress < 1,
            isVisible: progress < 1,
          },
        }));

        if (progress < 1) {
          const frameId = requestAnimationFrame(animate);
          animationFramesRef.current.push(frameId);
        }
      };

      const frameId = requestAnimationFrame(animate);
      animationFramesRef.current.push(frameId);
    },
    []
  );

  useEffect(() => {
    // Detect when trigger transitions from false to true
    if (trigger && !prevTriggerRef.current) {
      setIsActive(true);
      setElementStates(getInitialStates());
      startTimeRef.current = Date.now();

      // Schedule fade-outs for each element
      elements.forEach(element => {
        const timeout = setTimeout(() => {
          // Mark as fading and start animation
          setElementStates(prev => ({
            ...prev,
            [element.key]: {
              ...prev[element.key],
              isFading: true,
            },
          }));

          animateOpacity(element.key, element.fadeDuration, Date.now());
        }, element.visibleDuration);

        timeoutsRef.current.push(timeout);
      });

      // Schedule completion callback
      const maxDuration = Math.max(
        ...elements.map(e => e.visibleDuration + e.fadeDuration)
      );
      const completeTimeout = setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, maxDuration);
      timeoutsRef.current.push(completeTimeout);
    }

    // Trigger turned off - reset
    if (!trigger && prevTriggerRef.current) {
      reset();
    }

    prevTriggerRef.current = trigger;

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      animationFramesRef.current.forEach(cancelAnimationFrame);
    };
  }, [trigger, elements, onComplete, reset, getInitialStates, animateOpacity]);

  return {
    elementStates,
    isActive,
    reset,
  };
}

export default useSequentialFadeOut;
