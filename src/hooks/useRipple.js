import { useState, useCallback } from 'react';
/**
 * Custom hook for creating beautiful ripple effects on click
 * Returns ripples array and a handler to trigger new ripples
 *
 * @example
 * ```tsx
 * const { ripples, createRipple } = useRipple();
 *
 * <button onClick={createRipple} className="relative overflow-hidden">
 *   Click me
 *   {ripples.map(ripple => (
 *     <span
 *       key={ripple.id}
 *       className="absolute rounded-full bg-white/30 animate-ripple"
 *       style={{
 *         left: ripple.x,
 *         top: ripple.y,
 *         width: 10,
 *         height: 10,
 *         transform: 'translate(-50%, -50%)'
 *       }}
 *     />
 *   ))}
 * </button>
 * ```
 */
export function useRipple() {
    const [ripples, setRipples] = useState([]);
    const createRipple = useCallback((event) => {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const id = Date.now();
        const newRipple = { x, y, id };
        setRipples(prev => [...prev, newRipple]);
        // Remove ripple after animation completes (600ms)
        setTimeout(() => {
            setRipples(prev => prev.filter(ripple => ripple.id !== id));
        }, 600);
    }, []);
    return { ripples, createRipple };
}
