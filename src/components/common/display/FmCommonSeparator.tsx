import * as React from 'react';
import { Separator } from '@/components/common/shadcn/separator';
import { cn } from '@/shared';

// ============================================================
// FmCommonSeparator - Force Majeure branded Separator wrapper
// ============================================================
// Wraps shadcn Separator with FM-consistent styling

interface FmCommonSeparatorProps
  extends React.ComponentPropsWithoutRef<typeof Separator> {
  variant?: 'default' | 'subtle' | 'gold';
}

const FmCommonSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  FmCommonSeparatorProps
>(({ className, variant = 'default', ...props }, ref) => (
  <Separator
    ref={ref}
    className={cn(
      variant === 'subtle' && 'bg-border/50',
      variant === 'gold' && 'bg-fm-gold/30',
      className
    )}
    {...props}
  />
));
FmCommonSeparator.displayName = 'FmCommonSeparator';

export { FmCommonSeparator };
