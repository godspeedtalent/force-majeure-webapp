import { useEffect, useState } from 'react';
import { cn } from '@/shared';
import { type IndicatorSize, INDICATOR_SIZE_VALUES } from '../types';

interface TouchIndicatorProps {
  /** X coordinate relative to viewport */
  x: number;
  /** Y coordinate relative to viewport */
  y: number;
  /** Size of the indicator */
  size: IndicatorSize;
  /** Called when animation completes */
  onAnimationEnd?: () => void;
  /** Unique key for this indicator */
  id: string;
}

/**
 * Touch indicator component that shows a ripple effect at the touch location.
 * Renders as a gold ring that scales up and fades out.
 */
export function TouchIndicator({
  x,
  y,
  size,
  onAnimationEnd,
}: TouchIndicatorProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const sizeValue = INDICATOR_SIZE_VALUES[size];

  useEffect(() => {
    // Animation duration matches CSS animation (400ms)
    const timer = setTimeout(() => {
      setIsAnimating(false);
      onAnimationEnd?.();
    }, 400);

    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  if (!isAnimating) return null;

  return (
    <div
      className={cn(
        'absolute pointer-events-none',
        // Center on touch point
        '-translate-x-1/2 -translate-y-1/2',
        // Gold ring styling
        'rounded-full',
        'border-2 border-fm-gold',
        'bg-fm-gold/30',
        // Animation
        'animate-demo-tap-ripple'
      )}
      style={{
        left: x,
        top: y,
        width: sizeValue,
        height: sizeValue,
      }}
      aria-hidden="true"
    />
  );
}
