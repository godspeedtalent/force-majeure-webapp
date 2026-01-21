import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/shared';

/**
 * Portal-based tooltip that renders to document body to avoid clipping issues.
 * Use this instead of the shadcn Tooltip when content may be clipped by parent overflow.
 *
 * This is the preferred tooltip for use in:
 * - FmToolbar and its tab contents
 * - Modals and dialogs
 * - Any scrollable container with overflow: hidden/auto
 * - Sidebars and drawers
 */

interface FmPortalTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  delayDuration?: number;
  className?: string;
  /** Custom arrow className for styling the tooltip arrow */
  arrowClassName?: string;
  asChild?: boolean;
}

export const FmPortalTooltip = ({
  children,
  content,
  side = 'top',
  sideOffset = 5,
  delayDuration = 300,
  className,
  arrowClassName,
  asChild = true,
}: FmPortalTooltipProps) => {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild={asChild}>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={sideOffset}
            className={cn(
              'z-[9999] overflow-hidden rounded-sm border border-white/20 bg-black/95 px-3 py-1.5 text-xs text-white shadow-md',
              'animate-in fade-in-0 zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-2',
              'data-[side=left]:slide-in-from-right-2',
              'data-[side=right]:slide-in-from-left-2',
              'data-[side=top]:slide-in-from-bottom-2',
              className
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className={cn('fill-black/95', arrowClassName)} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

/**
 * Simplified tooltip for quick inline use
 * Example: <FmTooltip content="Hello">Hover me</FmTooltip>
 */
export const FmTooltip = FmPortalTooltip;
