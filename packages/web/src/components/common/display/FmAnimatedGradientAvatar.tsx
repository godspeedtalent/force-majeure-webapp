'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@force-majeure/shared';

interface FmAnimatedGradientAvatarProps {
  className?: string;
}

/**
 * Animated gradient avatar with swirling mist-like gradients and cursor interaction
 * Colors: gold, black, white, transparent
 * Cursor interaction radius: 50% of height with fade effect
 */
export const FmAnimatedGradientAvatar = ({
  className,
}: FmAnimatedGradientAvatarProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePosition({ x, y });
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Calculate distance-based influence for cursor interaction
  const calculateInfluence = (orbX: number, orbY: number) => {
    const dx = mousePosition.x - orbX;
    const dy = mousePosition.y - orbY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Influence radius is 0.5 (50% of container)
    const influenceRadius = 0.5;
    const influence = Math.max(0, 1 - distance / influenceRadius);

    return {
      x: dx * influence * 100,
      y: dy * influence * 100,
    };
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full overflow-hidden rounded-md bg-black',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Base swirling mist layer */}
      <div className='absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 opacity-90' />

      {/* Mist Orb 1 - Gold (top-left quadrant) */}
      <div
        className='absolute w-full h-full transition-transform duration-700 ease-out'
        style={{
          transform: isHovered
            ? `translate(${calculateInfluence(0.3, 0.3).x}px, ${calculateInfluence(0.3, 0.3).y}px)`
            : 'translate(0, 0)',
        }}
      >
        <div className='absolute top-[10%] left-[10%] w-[60%] h-[60%] bg-gradient-radial from-fm-gold/40 via-fm-gold/15 to-transparent rounded-full blur-[80px] animate-float' />
      </div>

      {/* Mist Orb 2 - White (top-right quadrant) */}
      <div
        className='absolute w-full h-full transition-transform duration-700 ease-out'
        style={{
          transform: isHovered
            ? `translate(${calculateInfluence(0.7, 0.25).x}px, ${calculateInfluence(0.7, 0.25).y}px)`
            : 'translate(0, 0)',
        }}
      >
        <div className='absolute top-[15%] right-[15%] w-[50%] h-[50%] bg-gradient-radial from-white/25 via-white/10 to-transparent rounded-full blur-[70px] animate-float-delay-1' />
      </div>

      {/* Mist Orb 3 - Gold (center) */}
      <div
        className='absolute w-full h-full transition-transform duration-700 ease-out'
        style={{
          transform: isHovered
            ? `translate(${calculateInfluence(0.5, 0.5).x}px, ${calculateInfluence(0.5, 0.5).y}px)`
            : 'translate(0, 0)',
        }}
      >
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] h-[55%] bg-gradient-radial from-fm-gold/30 via-fm-gold/12 to-transparent rounded-full blur-[90px] animate-float-delay-2' />
      </div>

      {/* Mist Orb 4 - White (bottom-left quadrant) */}
      <div
        className='absolute w-full h-full transition-transform duration-700 ease-out'
        style={{
          transform: isHovered
            ? `translate(${calculateInfluence(0.25, 0.75).x}px, ${calculateInfluence(0.25, 0.75).y}px)`
            : 'translate(0, 0)',
        }}
      >
        <div className='absolute bottom-[12%] left-[18%] w-[48%] h-[48%] bg-gradient-radial from-white/20 via-white/8 to-transparent rounded-full blur-[75px] animate-float-delay-3' />
      </div>

      {/* Mist Orb 5 - Black (bottom-right quadrant) */}
      <div
        className='absolute w-full h-full transition-transform duration-700 ease-out'
        style={{
          transform: isHovered
            ? `translate(${calculateInfluence(0.75, 0.7).x}px, ${calculateInfluence(0.75, 0.7).y}px)`
            : 'translate(0, 0)',
        }}
      >
        <div className='absolute bottom-[20%] right-[12%] w-[45%] h-[45%] bg-gradient-radial from-zinc-800/60 via-zinc-900/30 to-transparent rounded-full blur-[65px] animate-float' />
      </div>

      {/* Large cursor interaction orb - 50% height radius with fade */}
      <div
        className='absolute w-full h-full transition-opacity duration-300 ease-out pointer-events-none'
        style={{
          opacity: isHovered ? 1 : 0,
        }}
      >
        <div
          className='absolute transition-all duration-200 ease-out'
          style={{
            left: `${mousePosition.x * 100}%`,
            top: `${mousePosition.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
          }}
        >
          <div className='absolute inset-0 bg-gradient-radial from-fm-gold/35 via-fm-gold/15 via-30% via-white/10 via-60% to-transparent rounded-full blur-[100px]' />
        </div>
      </div>

      {/* Swirling overlay for color mixing */}
      <div className='absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-zinc-900/20 mix-blend-overlay' />

      {/* Subtle vignette */}
      <div className='absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/40' />
    </div>
  );
};
