import { ReactNode, useEffect, useState } from 'react';

import { cn } from '@force-majeure/shared/utils/utils';

export interface ParallaxLayer {
  /** Unique identifier for the layer */
  id: string;
  /** The content/component to render in this layer */
  content: ReactNode;
  /** Parallax speed multiplier (0 = no movement, 1 = moves with scroll, 0.5 = half speed) */
  speed: number;
  /** Z-index for layer ordering (higher = closer to user) */
  zIndex?: number;
  /** Additional CSS classes */
  className?: string;
  /** Opacity level (0-1) */
  opacity?: number;
}

interface ParallaxLayerManagerProps {
  /** Array of parallax layers, ordered from back to front */
  layers: ParallaxLayer[];
  /** Foreground content (rendered on top with no parallax) */
  children: ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * ParallaxLayerManager
 *
 * Manages multiple parallax background layers with independent scroll speeds.
 * Layers are rendered from back to front, with foreground content on top.
 *
 * @example
 * ```tsx
 * <ParallaxLayerManager
 *   layers={[
 *     {
 *       id: 'topography',
 *       content: <TopographicBackground opacity={0.1} parallax={false} />,
 *       speed: 0.3,
 *       zIndex: 1,
 *     },
 *     {
 *       id: 'gradient',
 *       content: <div className='absolute inset-0 bg-gradient-monochrome' />,
 *       speed: 0.5,
 *       zIndex: 2,
 *       opacity: 0.05,
 *     },
 *   ]}
 * >
 *   <div>Foreground content here</div>
 * </ParallaxLayerManager>
 * ```
 */
export const ParallaxLayerManager = ({
  layers,
  children,
  className,
}: ParallaxLayerManagerProps) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={cn('relative', className)}>
      {/* Parallax layers */}
      {layers.map((layer) => {
        const translateY = scrollY * layer.speed;

        return (
          <div
            key={layer.id}
            className={cn(
              'absolute inset-0 pointer-events-none overflow-hidden',
              layer.className
            )}
            style={{
              zIndex: layer.zIndex || 0,
              opacity: layer.opacity,
              transform: `translateY(${translateY}px)`,
              transition: 'transform 0.3s ease-out',
              willChange: 'transform',
            }}
          >
            {layer.content}
          </div>
        );
      })}

      {/* Foreground content */}
      <div className='relative z-10'>
        {children}
      </div>
    </div>
  );
};
