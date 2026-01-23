import { useEffect, useRef, useCallback, useState } from 'react';
import { type TouchPoint, type DemoModeSettings } from '../types';

interface UseDemoModeTouchHandlerOptions {
  /** Demo mode settings */
  settings: DemoModeSettings;
}

interface UseDemoModeTouchHandlerReturn {
  /** Currently active touch points for visualization */
  activeTouches: TouchPoint[];
  /** Touch points that are in long press state */
  longPressTouches: TouchPoint[];
  /** Remove a touch indicator by ID */
  removeTouch: (id: string) => void;
}

// Movement threshold to distinguish tap from scroll (in pixels)
const MOVE_THRESHOLD = 10;

// Maximum concurrent touches to track
const MAX_TOUCHES = 5;

/**
 * Hook that handles touch event interception for demo mode.
 * Tracks touch positions, detects long presses, and optionally delays actions.
 */
export function useDemoModeTouchHandler({
  settings,
}: UseDemoModeTouchHandlerOptions): UseDemoModeTouchHandlerReturn {
  const [activeTouches, setActiveTouches] = useState<TouchPoint[]>([]);
  const [longPressTouches, setLongPressTouches] = useState<TouchPoint[]>([]);

  // Refs for tracking touch state without causing re-renders
  const touchMapRef = useRef<Map<number, TouchPoint>>(new Map());
  const longPressTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const delayTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const startPositionsRef = useRef<Map<number, { x: number; y: number }>>(
    new Map()
  );

  const removeTouch = useCallback((id: string) => {
    setActiveTouches(prev => prev.filter(t => t.id !== id));
    setLongPressTouches(prev => prev.filter(t => t.id !== id));
  }, []);

  // Clear all timers on unmount
  useEffect(() => {
    return () => {
      longPressTimersRef.current.forEach(timer => clearTimeout(timer));
      delayTimersRef.current.forEach(timer => clearTimeout(timer));
      longPressTimersRef.current.clear();
      delayTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!settings.enabled) {
      // Clear everything when disabled
      setActiveTouches([]);
      setLongPressTouches([]);
      touchMapRef.current.clear();
      startPositionsRef.current.clear();
      longPressTimersRef.current.forEach(timer => clearTimeout(timer));
      longPressTimersRef.current.clear();
      return;
    }

    const handleTouchStart = (event: TouchEvent) => {
      // Don't intercept if we've hit max touches
      if (touchMapRef.current.size >= MAX_TOUCHES) return;

      const changedTouches = event.changedTouches;

      for (let i = 0; i < changedTouches.length; i++) {
        const touch = changedTouches[i];
        const id = `touch-${Date.now()}-${touch.identifier}`;

        const touchPoint: TouchPoint = {
          id,
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now(),
          type: 'tap',
          isActive: true,
          touchIdentifier: touch.identifier,
          target: event.target,
        };

        // Store touch info
        touchMapRef.current.set(touch.identifier, touchPoint);
        startPositionsRef.current.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY,
        });

        // Add to active touches for visualization
        setActiveTouches(prev => [...prev.slice(-(MAX_TOUCHES - 1)), touchPoint]);

        // Start long press timer if enabled
        if (settings.showLongPressIndicator) {
          const timer = setTimeout(() => {
            const currentTouch = touchMapRef.current.get(touch.identifier);
            if (currentTouch && currentTouch.isActive) {
              // Update to long press type
              currentTouch.type = 'longPress';
              touchMapRef.current.set(touch.identifier, currentTouch);

              setLongPressTouches(prev => [
                ...prev.filter(t => t.id !== currentTouch.id),
                currentTouch,
              ]);
            }
            longPressTimersRef.current.delete(touch.identifier);
          }, settings.longPressThreshold);

          longPressTimersRef.current.set(touch.identifier, timer);
        }

        // Handle action delay if enabled
        if (settings.delayEnabled) {
          // We don't preventDefault here - we just add visual feedback
          // The action will proceed naturally after the visual delay

          // Store the delay timer
          const delayTimer = setTimeout(() => {
            delayTimersRef.current.delete(id);
          }, settings.delayDuration);

          delayTimersRef.current.set(id, delayTimer);
        }
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      const changedTouches = event.changedTouches;

      for (let i = 0; i < changedTouches.length; i++) {
        const touch = changedTouches[i];
        const startPos = startPositionsRef.current.get(touch.identifier);
        const currentTouch = touchMapRef.current.get(touch.identifier);

        if (!startPos || !currentTouch) continue;

        // Calculate distance moved
        const dx = touch.clientX - startPos.x;
        const dy = touch.clientY - startPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If moved beyond threshold, cancel long press and mark as move
        if (distance > MOVE_THRESHOLD) {
          // Cancel long press timer
          const timer = longPressTimersRef.current.get(touch.identifier);
          if (timer) {
            clearTimeout(timer);
            longPressTimersRef.current.delete(touch.identifier);
          }

          // Update touch type to move
          currentTouch.type = 'move';
          currentTouch.x = touch.clientX;
          currentTouch.y = touch.clientY;
          touchMapRef.current.set(touch.identifier, currentTouch);

          // Remove from long press touches if present
          setLongPressTouches(prev =>
            prev.filter(t => t.touchIdentifier !== touch.identifier)
          );
        }
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const changedTouches = event.changedTouches;

      for (let i = 0; i < changedTouches.length; i++) {
        const touch = changedTouches[i];
        const currentTouch = touchMapRef.current.get(touch.identifier);

        if (currentTouch) {
          // Mark as inactive
          currentTouch.isActive = false;
          touchMapRef.current.delete(touch.identifier);
        }

        // Clear long press timer
        const timer = longPressTimersRef.current.get(touch.identifier);
        if (timer) {
          clearTimeout(timer);
          longPressTimersRef.current.delete(touch.identifier);
        }

        // Clear start position
        startPositionsRef.current.delete(touch.identifier);

        // Remove from long press touches
        setLongPressTouches(prev =>
          prev.filter(t => t.touchIdentifier !== touch.identifier)
        );
      }
    };

    const handleTouchCancel = (event: TouchEvent) => {
      // Treat cancel same as end
      handleTouchEnd(event);
    };

    // Add listeners in capture phase to see events before they reach targets
    // Using passive: true since we're not preventing default
    document.addEventListener('touchstart', handleTouchStart, {
      capture: true,
      passive: true,
    });
    document.addEventListener('touchmove', handleTouchMove, {
      capture: true,
      passive: true,
    });
    document.addEventListener('touchend', handleTouchEnd, {
      capture: true,
      passive: true,
    });
    document.addEventListener('touchcancel', handleTouchCancel, {
      capture: true,
      passive: true,
    });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart, {
        capture: true,
      });
      document.removeEventListener('touchmove', handleTouchMove, {
        capture: true,
      });
      document.removeEventListener('touchend', handleTouchEnd, {
        capture: true,
      });
      document.removeEventListener('touchcancel', handleTouchCancel, {
        capture: true,
      });
    };
  }, [settings]);

  return {
    activeTouches,
    longPressTouches,
    removeTouch,
  };
}
