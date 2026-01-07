/**
 * FmFeatheredDivider
 *
 * Simple horizontal gold gradient divider that fades at edges.
 * Used for subtle visual separation in forms and sections.
 */

import { cn } from '@/shared';

interface FmFeatheredDividerProps {
  /** Intensity of the gold color */
  intensity?: 'subtle' | 'medium' | 'strong';
  /** Additional CSS classes */
  className?: string;
}

const intensityClasses = {
  subtle: 'via-fm-gold/30',
  medium: 'via-fm-gold/50',
  strong: 'via-fm-gold/70',
};

export const FmFeatheredDivider = ({
  intensity = 'medium',
  className,
}: FmFeatheredDividerProps) => {
  return (
    <div
      className={cn(
        'h-px bg-gradient-to-r from-transparent to-transparent',
        intensityClasses[intensity],
        className
      )}
    />
  );
};

FmFeatheredDivider.displayName = 'FmFeatheredDivider';
