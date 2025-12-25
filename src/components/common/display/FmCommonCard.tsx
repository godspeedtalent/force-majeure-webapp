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
// - Frosted glass background by default
// - Subtle gold glow + brightness increase on hover
// - Consistent spacing and transitions
//
// Usage:
//   <FmCommonCard>Content</FmCommonCard>  // frosted with hover effects
//   <FmCommonCard variant="outline">...</FmCommonCard>  // transparent with border
//   <FmCommonCard hoverable={false}>...</FmCommonCard>  // disable hover effects

interface FmCommonCardProps extends Omit<React.ComponentPropsWithoutRef<typeof Card>, 'variant'> {
  /** Card background style. Defaults to 'frosted' (glass effect) */
  variant?: 'frosted' | 'outline';
  /** Enable hover effects (border glow, brightness). Defaults to true */
  hoverable?: boolean;
}

const FmCommonCard = React.forwardRef<HTMLDivElement, FmCommonCardProps>(
  ({ className, variant = 'frosted', hoverable = true, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(
        // Base styles
        'transition-all duration-300',
        // Variant styles
        variant === 'frosted' &&
          'bg-background/60 backdrop-blur-md border-border',
        variant === 'outline' && 'bg-transparent border border-white/20',
        // Hover effects (when enabled)
        hoverable &&
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
