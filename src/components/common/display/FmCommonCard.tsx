import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/common/shadcn/card';
import { cn } from '@/shared';

// ============================================================
// FmCommonCard - Force Majeure branded Card wrapper
// ============================================================
// Wraps shadcn Card with FM branding:
// - Default: Semi-transparent muted background with gold border, subtle hover
// - Frosted: Glass effect background with blur (for modals, overlays)
// - Frosted variant has subtle gold glow + brightness increase on hover
// - Consistent spacing and transitions
//
// Usage:
//   <FmCommonCard>Content</FmCommonCard>  // default with gold border, subtle hover
//   <FmCommonCard variant="frosted">...</FmCommonCard>  // frosted glass effect
//   <FmCommonCard hoverable={false}>...</FmCommonCard>  // disable hover effects

interface FmCommonCardProps extends Omit<React.ComponentPropsWithoutRef<typeof Card>, 'variant'> {
  /** Card background style. Defaults to semi-transparent with gold hover */
  variant?: 'default' | 'frosted';
  /** Enable hover effects (border glow, brightness). Defaults to true */
  hoverable?: boolean;
}

const FmCommonCard = React.forwardRef<HTMLDivElement, FmCommonCardProps>(
  ({ className, variant = 'default', hoverable = true, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(
        // Base styles
        'transition-all duration-300 min-w-0 overflow-hidden',
        // Variant styles
        variant === 'default' &&
          'bg-muted/20 border border-fm-gold/30',
        variant === 'frosted' &&
          'bg-background/60 backdrop-blur-md border-border',
        // Hover effects (when enabled)
        hoverable && variant === 'default' &&
          'hover:bg-white/5',
        hoverable && variant === 'frosted' &&
          'hover:border-white/30 hover:shadow-[0_0_8px_rgba(223,186,125,0.08)] hover:bg-background/55 hover:brightness-[1.02]',
        className
      )}
      {...props}
    />
  )
);
FmCommonCard.displayName = 'FmCommonCard';

const FmCommonCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardHeader ref={ref} className={cn('', className)} {...props} />
));
FmCommonCardHeader.displayName = 'FmCommonCardHeader';

const FmCommonCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <CardTitle ref={ref} className={cn('', className)} {...props} />
));
FmCommonCardTitle.displayName = 'FmCommonCardTitle';

const FmCommonCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <CardDescription ref={ref} className={cn('', className)} {...props} />
));
FmCommonCardDescription.displayName = 'FmCommonCardDescription';

const FmCommonCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardContent ref={ref} className={cn('', className)} {...props} />
));
FmCommonCardContent.displayName = 'FmCommonCardContent';

const FmCommonCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardFooter ref={ref} className={cn('', className)} {...props} />
));
FmCommonCardFooter.displayName = 'FmCommonCardFooter';

export {
  FmCommonCard,
  FmCommonCardHeader,
  FmCommonCardTitle,
  FmCommonCardDescription,
  FmCommonCardContent,
  FmCommonCardFooter,
};
