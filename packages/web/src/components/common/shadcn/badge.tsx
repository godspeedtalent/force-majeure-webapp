import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@force-majeure/shared';

const badgeVariants = cva(
  'inline-flex items-center rounded-none border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-sm bg-background/70',
  {
    variants: {
      variant: {
        default: 'border-white/20 text-foreground',
        secondary: 'border-white/20 text-foreground',
        destructive: 'border-destructive/40 text-destructive-foreground',
        outline: 'border-white/20 text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
