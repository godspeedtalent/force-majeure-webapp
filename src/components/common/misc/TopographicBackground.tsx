import { cn } from '@/shared/utils/utils';

interface TopographicBackgroundProps {
  opacity?: number;
  className?: string;
}

/**
 * Reusable mirrored topographic background component
 * Creates a seamless, endless pattern by mirroring the topographic texture across X and Y axes
 * Each tile is flipped to create continuous transitions without visible seams
 *
 * Pattern creates a 2x2 grid (2160x2160px) that repeats:
 * - Top-left: Normal
 * - Top-right: Flipped horizontally
 * - Bottom-left: Flipped vertically
 * - Bottom-right: Flipped both ways
 *
 * @param opacity - Opacity level (0-1), defaults to 0.03
 * @param className - Additional CSS classes for the container
 */
export const TopographicBackground = ({
  opacity = 0.03,
  className
}: TopographicBackgroundProps) => {
  const TILE_SIZE = 1080; // Original image size
  const baseStyle = {
    backgroundImage: 'url(/images/topographic-pattern.png)',
    backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
    backgroundRepeat: 'repeat',
  };

  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)} style={{ opacity }}>
      {/* Top-left quadrant - Normal */}
      <div
        className="absolute inset-0"
        style={{
          ...baseStyle,
          backgroundPosition: '0 0',
        }}
      />

      {/* Top-right quadrant - Flipped horizontally */}
      <div
        className="absolute inset-0"
        style={{
          ...baseStyle,
          backgroundPosition: '0 0',
          transform: 'scaleX(-1)',
          maskImage: `repeating-linear-gradient(90deg, transparent 0, transparent ${TILE_SIZE}px, black ${TILE_SIZE}px, black ${TILE_SIZE * 2}px)`,
          WebkitMaskImage: `repeating-linear-gradient(90deg, transparent 0, transparent ${TILE_SIZE}px, black ${TILE_SIZE}px, black ${TILE_SIZE * 2}px)`,
        }}
      />

      {/* Bottom-left quadrant - Flipped vertically */}
      <div
        className="absolute inset-0"
        style={{
          ...baseStyle,
          backgroundPosition: '0 0',
          transform: 'scaleY(-1)',
          maskImage: `repeating-linear-gradient(180deg, transparent 0, transparent ${TILE_SIZE}px, black ${TILE_SIZE}px, black ${TILE_SIZE * 2}px)`,
          WebkitMaskImage: `repeating-linear-gradient(180deg, transparent 0, transparent ${TILE_SIZE}px, black ${TILE_SIZE}px, black ${TILE_SIZE * 2}px)`,
        }}
      />

      {/* Bottom-right quadrant - Flipped both ways */}
      <div
        className="absolute inset-0"
        style={{
          ...baseStyle,
          backgroundPosition: '0 0',
          transform: 'scale(-1, -1)',
          maskImage: `
            repeating-linear-gradient(90deg, transparent 0, transparent ${TILE_SIZE}px, black ${TILE_SIZE}px, black ${TILE_SIZE * 2}px),
            repeating-linear-gradient(180deg, transparent 0, transparent ${TILE_SIZE}px, black ${TILE_SIZE}px, black ${TILE_SIZE * 2}px)
          `,
          WebkitMaskImage: `
            repeating-linear-gradient(90deg, transparent 0, transparent ${TILE_SIZE}px, black ${TILE_SIZE}px, black ${TILE_SIZE * 2}px),
            repeating-linear-gradient(180deg, transparent 0, transparent ${TILE_SIZE}px, black ${TILE_SIZE}px, black ${TILE_SIZE * 2}px)
          `,
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
        }}
      />
    </div>
  );
};
