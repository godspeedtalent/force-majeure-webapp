import { useEffect, useRef, useCallback } from 'react';
/**
 * Hook for detecting touch swipe gestures
 * Useful for manual section navigation on mobile
 */
export const useTouchGesture = (elementRef, options = {}) => {
    const { onSwipe, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, threshold = 50, enabled = true, } = options;
    const touchStartRef = useRef(null);
    const handleTouchStart = useCallback((e) => {
        if (!enabled)
            return;
        const touch = e.touches[0];
        touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
        };
    }, [enabled]);
    const handleTouchEnd = useCallback((e) => {
        if (!enabled || !touchStartRef.current)
            return;
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        // Determine swipe direction based on larger delta
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        if (Math.max(absX, absY) < threshold) {
            touchStartRef.current = null;
            return;
        }
        let direction;
        if (absX > absY) {
            // Horizontal swipe
            direction = deltaX > 0 ? 'right' : 'left';
        }
        else {
            // Vertical swipe
            direction = deltaY > 0 ? 'down' : 'up';
        }
        // Call appropriate callbacks
        onSwipe?.(direction);
        switch (direction) {
            case 'up':
                onSwipeUp?.();
                break;
            case 'down':
                onSwipeDown?.();
                break;
            case 'left':
                onSwipeLeft?.();
                break;
            case 'right':
                onSwipeRight?.();
                break;
        }
        touchStartRef.current = null;
    }, [enabled, threshold, onSwipe, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight]);
    useEffect(() => {
        const element = elementRef.current;
        if (!element || !enabled)
            return;
        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });
        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }, [elementRef, enabled, handleTouchStart, handleTouchEnd]);
};
