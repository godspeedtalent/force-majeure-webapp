import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/common/shadcn/card';
import { cn } from '@/shared/utils/utils';

// ============================================================
// FmCommonCard - Force Majeure branded Card wrapper
// ============================================================
// Wraps shadcn Card with FM branding:
// - Gold border glow on hover
// - Consistent spacing and transitions
// - Frosted glass variant support

interface FmCommonCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  variant?: 'default' | 'frosted';
  hoverable?: boolean;
}

const FmCommonCard = React.forwardRef<HTMLDivElement, FmCommonCardProps>(
  ({ className, variant = 'default', hoverable = false, ...props }, ref) => (
    <Card
      ref={ref}
      variant={variant}
      className={cn(
        'transition-all duration-300',
        hoverable && 'hover:border-fm-gold/50 hover:shadow-[0_0_12px_rgba(212,175,55,0.15)]',
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
