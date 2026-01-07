import { ReactNode } from 'react';
import { cn, useIsMobile } from '@/shared';

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
 * - On mobile, adds extra bottom margin to clear the mobile tab bar
 */
export const FmStickyFooter = ({
  children,
  className,
}: FmStickyFooterProps) => {
  const isMobile = useIsMobile();

  // Mobile bottom tab bar is ~70px + safe area, account for it
  const bottomOffset = isMobile ? 'bottom-[70px]' : 'bottom-0';

  return (
    <div
      className={cn(
        'sticky left-0 right-0 z-40',
        bottomOffset,
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
