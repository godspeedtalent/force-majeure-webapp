import { cn } from '@/shared';
import { type IndicatorSize, INDICATOR_SIZE_VALUES } from '../types';

interface LongPressIndicatorProps {
  /** X coordinate relative to viewport */
  x: number;
  /** Y coordinate relative to viewport */
  y: number;
  /** Size of the indicator */
  size: IndicatorSize;
  /** Duration in milliseconds for the fill animation */
  duration: number;
  /** Whether the animation is active */
  isActive: boolean;
}

/**
 * Long press indicator that shows a circular fill animation.
 * Uses SVG stroke-dasharray/stroke-dashoffset for smooth progress animation.
 */
export function LongPressIndicator({
  x,
  y,
  size,
  duration,
  isActive,
}: LongPressIndicatorProps) {
  const sizeValue = INDICATOR_SIZE_VALUES[size];
  const strokeWidth = 4;
  const radius = (sizeValue - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (!isActive) return null;

  return (
    <div
      className={cn(
        'absolute pointer-events-none',
        // Center on touch point
        '-translate-x-1/2 -translate-y-1/2'
      )}
      style={{
        left: x,
        top: y,
        width: sizeValue,
        height: sizeValue,
      }}
      aria-hidden="true"
    >
      <svg
        className="-rotate-90"
        width={sizeValue}
        height={sizeValue}
        viewBox={`0 0 ${sizeValue} ${sizeValue}`}
      >
        {/* Background circle */}
        <circle
          className="fill-none stroke-fm-gold/20"
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          className="fill-none stroke-fm-gold animate-demo-long-press-fill"
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          style={
            {
              '--fill-duration': `${duration}ms`,
            } as React.CSSProperties
          }
        />
      </svg>
      {/* Center dot */}
      <div
        className={cn(
          'absolute top-1/2 left-1/2',
          '-translate-x-1/2 -translate-y-1/2',
          'w-2 h-2 rounded-full',
          'bg-fm-gold',
          'animate-pulse'
        )}
      />
    </div>
  );
}
