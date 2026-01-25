import { useMemo } from 'react';
import { cn } from '@/shared';

interface FmGoldenGridLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeConfig = {
  sm: { container: 'w-4 h-4', gridSize: 2, gap: 2 },
  md: { container: 'w-6 h-6', gridSize: 3, gap: 4 },
  lg: { container: 'w-10 h-10', gridSize: 4, gap: 4 },
  xl: { container: 'w-16 h-16', gridSize: 5, gap: 6 },
};

// Seeded random number generator for consistent but random-looking delays
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

/**
 * FmGoldenGridLoader - Primary loading spinner for Force Majeure
 *
 * A grid of squares that pulse with sporadic, randomized timing,
 * creating a mesmerizing chaotic effect. Grid dimensions scale with size:
 * - sm: 2x2 grid
 * - md: 3x3 grid
 * - lg: 4x4 grid
 * - xl: 5x5 grid
 *
 * Respects prefers-reduced-motion for accessibility.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <FmGoldenGridLoader />
 *
 * // With size variant
 * <FmGoldenGridLoader size="lg" />
 *
 * // In a button loading state
 * {isLoading && <FmGoldenGridLoader size="sm" className="mr-2" />}
 * ```
 */
export function FmGoldenGridLoader({
  size = 'md',
  className,
}: FmGoldenGridLoaderProps) {
  const config = sizeConfig[size];
  const { gridSize, gap } = config;
  const totalCells = gridSize * gridSize;

  // Generate randomized animation parameters for each cell
  const cellParams = useMemo(() => {
    return Array.from({ length: totalCells }).map((_, index) => {
      // Use seeded random for consistent randomness across renders
      const seed1 = index * 7 + 13;
      const seed2 = index * 11 + 17;
      const seed3 = index * 13 + 23;

      return {
        // Random delay between 0 and 2 seconds
        delay: seededRandom(seed1) * 2,
        // Random duration between 0.8 and 1.8 seconds
        duration: 0.8 + seededRandom(seed2) * 1,
        // Random initial opacity between 0.15 and 0.35
        baseOpacity: 0.15 + seededRandom(seed3) * 0.2,
      };
    });
  }, [totalCells]);

  // Calculate cell size based on grid
  const cellSize = (100 - gap * (gridSize - 1)) / gridSize;

  const getPosition = (index: number) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    return {
      x: col * (cellSize + gap),
      y: row * (cellSize + gap),
    };
  };

  // Find center cell for highlight (only for odd grids)
  const centerIndex = Math.floor(totalCells / 2);

  return (
    <div
      className={cn(
        'relative motion-reduce:animate-none',
        config.container,
        className
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full text-fm-gold"
        style={{
          animation: 'fm-grid-rotate 16s linear infinite',
        }}
      >
        {/* Grid of squares with randomized animations */}
        {Array.from({ length: totalCells }).map((_, index) => {
          const pos = getPosition(index);
          const params = cellParams[index];

          return (
            <rect
              key={index}
              x={pos.x}
              y={pos.y}
              width={cellSize}
              height={cellSize}
              fill="currentColor"
              style={{
                opacity: params.baseOpacity,
                animation: `fm-grid-pulse-${index % 3} ${params.duration}s ease-in-out infinite ${params.delay}s`,
                transformOrigin: `${pos.x + cellSize / 2}px ${pos.y + cellSize / 2}px`,
              }}
            />
          );
        })}

        {/* Center cell highlight overlay (only for odd grids) */}
        {gridSize % 2 === 1 && (
          <rect
            x={getPosition(centerIndex).x}
            y={getPosition(centerIndex).y}
            width={cellSize}
            height={cellSize}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            style={{
              animation: 'fm-grid-center-glow 2.5s ease-in-out infinite',
              filter: 'drop-shadow(0 0 4px rgba(223, 186, 125, 0.5))',
            }}
          />
        )}
      </svg>

      <style>{`
        @keyframes fm-grid-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Three slightly different pulse variations for more chaos */
        @keyframes fm-grid-pulse-0 {
          0%, 100% {
            opacity: 0.15;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1.05);
            filter: drop-shadow(0 0 8px rgba(223, 186, 125, 0.7));
          }
          60% {
            opacity: 0.9;
            transform: scale(0.95);
          }
        }

        @keyframes fm-grid-pulse-1 {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.85);
          }
          30% {
            opacity: 0.6;
            transform: scale(0.9);
          }
          55% {
            opacity: 1;
            transform: scale(1);
            filter: drop-shadow(0 0 6px rgba(223, 186, 125, 0.6));
          }
        }

        @keyframes fm-grid-pulse-2 {
          0%, 100% {
            opacity: 0.18;
            transform: scale(0.82);
          }
          25% {
            opacity: 0.4;
            transform: scale(0.88);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
            filter: drop-shadow(0 0 5px rgba(223, 186, 125, 0.5));
          }
          75% {
            opacity: 0.7;
            transform: scale(0.92);
          }
        }

        @keyframes fm-grid-center-glow {
          0%, 100% {
            opacity: 0.4;
            filter: drop-shadow(0 0 2px rgba(223, 186, 125, 0.2));
          }
          35% {
            opacity: 1;
            filter: drop-shadow(0 0 12px rgba(223, 186, 125, 0.9));
          }
          70% {
            opacity: 0.6;
            filter: drop-shadow(0 0 6px rgba(223, 186, 125, 0.5));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes fm-grid-rotate { 0%, 100% { transform: none; } }
          @keyframes fm-grid-pulse-0 { 0%, 100% { opacity: 0.5; transform: none; filter: none; } }
          @keyframes fm-grid-pulse-1 { 0%, 100% { opacity: 0.5; transform: none; filter: none; } }
          @keyframes fm-grid-pulse-2 { 0%, 100% { opacity: 0.5; transform: none; filter: none; } }
          @keyframes fm-grid-center-glow { 0%, 100% { opacity: 0.7; filter: none; } }
        }
      `}</style>
    </div>
  );
}
