import { TopographicBackground } from '@/components/common/misc/TopographicBackground';

interface FmBackgroundLayerProps {
  /** Opacity of the topographic background (default: 0.35) */
  opacity?: number;
  /** Show gradient overlay (default: true) */
  showGradient?: boolean;
  /** Enable parallax scrolling effect (default: true) */
  parallax?: boolean;
  /** Parallax scroll speed multiplier (default: 0.5) */
  parallaxSpeed?: number;
}

/**
 * FmBackgroundLayer - Standardized background layer for layouts
 *
 * Combines the TopographicBackground with optional gradient overlay.
 * Use this in layouts to ensure consistent background styling.
 */
export const FmBackgroundLayer = ({
  opacity = 0.35,
  showGradient = true,
  parallax = true,
  parallaxSpeed = 0.5,
}: FmBackgroundLayerProps) => (
  <>
    <TopographicBackground opacity={opacity} parallax={parallax} parallaxSpeed={parallaxSpeed} />
    {showGradient && (
      <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
    )}
  </>
);
