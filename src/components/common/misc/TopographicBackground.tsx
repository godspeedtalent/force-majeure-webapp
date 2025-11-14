import { CSSProperties, useEffect, useState, useMemo } from 'react';

import { cn } from '@/shared/utils/utils';

interface TopographicBackgroundProps {
  opacity?: number;
  className?: string;
  parallax?: boolean;
  parallaxSpeed?: number;
}

/**
 * Reusable mirrored topographic background component
 * Creates a seamless, endless pattern by mirroring the topographic texture across X and Y axes
 * Each tile is flipped to create continuous transitions without visible seams
 *
 * Pattern creates a 3x3 grid that repeats infinitely:
 * - Center panel: Original image (no transformation)
 * - Adjacent edges: Flipped along the edge they share with center
 *   - Top: Flipped vertical
 *   - Right: Flipped horizontal
 *   - Bottom: Flipped vertical
 *   - Left: Flipped horizontal
 * - Corners: Flipped both vertically and horizontally
 *
 * This creates perfect mirroring where every edge matches seamlessly with its neighbor
 *
 * @param opacity - Opacity level (0-1), defaults to 0.03
 * @param className - Additional CSS classes for the container
 * @param parallax - Enable parallax scrolling effect (default: true)
 * @param parallaxSpeed - Parallax scroll speed multiplier (default: 0.5)
 */
export const TopographicBackground = ({
  opacity = 0.03,
  className,
  parallax = true,
  parallaxSpeed = 0.5,
}: TopographicBackgroundProps) => {
  const TILE_SIZE = 1080; // Original image size
  const [scrollY, setScrollY] = useState(0);

  // Random rotation (0, 90, 180, or 270 degrees) and flipping - stable per page load
  const { rotation, flipHorizontal, flipVertical } = useMemo(() => {
    // Use pathname hash for consistency across the same page
    const pathHash = window.location.pathname
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rotations = [0, 90, 180, 270];

    return {
      rotation: rotations[pathHash % 4],
      flipHorizontal: pathHash % 2 === 0, // 1 in 2 chance
      flipVertical: Math.floor(pathHash / 2) % 2 === 0, // 1 in 2 chance (different seed)
    };
  }, []);

  // Parallax scroll effect
  useEffect(() => {
    if (!parallax) return;

    const handleScroll = () => {
      setScrollY(window.scrollY * parallaxSpeed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [parallax, parallaxSpeed]);

  // Calculate grid size dynamically - use 3x3 pattern repeated
  // Each "super-tile" is 3 tiles wide/tall (3 * TILE_SIZE)
  const superTileSize = TILE_SIZE * 3;
  const gridCols = Math.ceil(window.innerWidth / superTileSize) + 4; // Extra for rotation
  const gridRows = Math.ceil(window.innerHeight / superTileSize) + 4;

  return (
    <div
      className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}
      style={{ opacity }}
    >
      {/* Create repeating 3x3 mirrored grid pattern with parallax and rotation */}
      <div
        className='absolute inset-0'
        style={{
          width: `${gridCols * superTileSize}px`,
          height: `${gridRows * superTileSize}px`,
          left: `-${(gridCols * superTileSize - window.innerWidth) / 2}px`,
          top: `-${(gridRows * superTileSize - window.innerHeight) / 2}px`,
          transform: `translateY(${scrollY}px) rotate(${rotation}deg) scaleX(${flipHorizontal ? -1 : 1}) scaleY(${flipVertical ? -1 : 1})`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease-out',
          willChange: 'transform',
        }}
      >
        {/* Generate super-tiles, each containing a 3x3 mirrored pattern */}
        {Array.from({ length: gridRows * gridCols }).map((_, superIndex) => {
          const superX = (superIndex % gridCols) * superTileSize;
          const superY = Math.floor(superIndex / gridCols) * superTileSize;

          return (
            <div
              key={superIndex}
              style={{
                position: 'absolute',
                left: `${superX}px`,
                top: `${superY}px`,
                width: `${superTileSize}px`,
                height: `${superTileSize}px`,
              }}
            >
              {/* Render the 3x3 pattern for this super-tile */}
              {[0, 1, 2].map(tileY =>
                [0, 1, 2].map(tileX => {
                  const centerX = 1;
                  const centerY = 1;
                  const flipX = tileX !== centerX;
                  const flipY = tileY !== centerY;

                  return (
                    <div
                      key={`${tileX}-${tileY}`}
                      style={{
                        position: 'absolute',
                        left: `${tileX * TILE_SIZE}px`,
                        top: `${tileY * TILE_SIZE}px`,
                        width: `${TILE_SIZE}px`,
                        height: `${TILE_SIZE}px`,
                        backgroundImage: 'url(/images/topographic-pattern.png)',
                        backgroundSize: '100% 100%',
                        transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
                      }}
                    />
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
