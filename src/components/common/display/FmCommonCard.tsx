import * as React from 'react';
import { LucideIcon } from 'lucide-react';
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
//   <FmCommonCard size="lg" onClick={handleClick}>...</FmCommonCard>  // clickable with padding

const sizeConfig = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

interface FmCommonCardProps extends Omit<React.ComponentPropsWithoutRef<typeof Card>, 'variant' | 'onClick'> {
  /** Card background style. Defaults to semi-transparent with gold hover */
  variant?: 'default' | 'frosted';
  /** Enable hover effects (border glow, brightness). Defaults to true */
  hoverable?: boolean;
  /** Size variant for padding */
  size?: 'sm' | 'md' | 'lg';
  /** Click handler - makes card interactive with accessibility support */
  onClick?: () => void;
}

const FmCommonCard = React.forwardRef<HTMLDivElement, FmCommonCardProps>(
  ({ className, variant = 'default', hoverable = true, size, onClick, ...props }, ref) => {
    const isClickable = !!onClick;

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick?.();
      }
    };

    return (
      <Card
        ref={ref}
        className={cn(
          // Base styles
          'transition-all duration-300 min-w-0 overflow-hidden',
          // Size padding
          size && sizeConfig[size],
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
          // Clickable styles
          isClickable && 'cursor-pointer',
          isClickable && hoverable && 'hover:scale-[1.005]',
          className
        )}
        onClick={onClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={isClickable ? handleKeyDown : undefined}
        {...props}
      />
    );
  }
);
FmCommonCard.displayName = 'FmCommonCard';

interface FmCommonCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional icon displayed before title */
  icon?: LucideIcon;
  /** Additional classes for the icon */
  iconClassName?: string;
}

const FmCommonCardHeader = React.forwardRef<HTMLDivElement, FmCommonCardHeaderProps>(
  ({ className, icon: Icon, iconClassName, children, ...props }, ref) => (
    <CardHeader ref={ref} className={cn('', className)} {...props}>
      {Icon ? (
        <div className='flex items-start gap-3'>
          <Icon className={cn('h-5 w-5 text-fm-gold mt-0.5 flex-shrink-0', iconClassName)} />
          <div className='flex-1'>{children}</div>
        </div>
      ) : (
        children
      )}
    </CardHeader>
  )
);
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
