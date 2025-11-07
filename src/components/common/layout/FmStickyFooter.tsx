import { ReactNode } from 'react';
import { cn } from '@/shared/utils/utils';

interface FmStickyFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * FmStickyFooter - A sticky footer component for big action buttons
 *
 * Features:
 * - Sticks to the bottom of the viewport
 * - Adds appropriate padding to prevent button clipping
 * - Backdrop blur and gradient background
 * - Smooth shadow for elevation
 */
export const FmStickyFooter = ({
  children,
  className,
}: FmStickyFooterProps) => {
  return (
    <div
      className={cn(
        'sticky bottom-0 left-0 right-0 z-40',
        'border-t border-border/50',
        'bg-gradient-to-t from-background via-background/98 to-background/95',
        'backdrop-blur-xl',
        'shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)]',
        'px-8 py-4',
        className
      )}
    >
      {children}
    </div>
  );
};
