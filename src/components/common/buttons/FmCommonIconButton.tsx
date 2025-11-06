import { forwardRef, useState, useCallback } from 'react';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@/shared/utils/utils';
import { LucideIcon, Plus } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useRipple } from '@/hooks/useRipple';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/shadcn/tooltip';

interface FmCommonIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'gold' | 'create';
  size?: 'default' | 'sm' | 'lg';
  icon: LucideIcon;
  loading?: boolean;
  tooltip?: string;
  asChild?: boolean;
}

/**
 * Icon-only button component with optional floating + indicator for create actions
 * Enhanced with click ripple effect and scale animation
 * Automatically wraps in tooltip if tooltip prop is provided
 */
export const FmCommonIconButton = forwardRef<HTMLButtonElement, FmCommonIconButtonProps>(
  (
    {
      variant = 'default',
      size = 'default',
      icon: Icon,
      loading = false,
      tooltip,
      className,
      disabled,
      asChild,
      onClick,
      ...props
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = useState(false);
    const { ripples, createRipple } = useRipple();
    const isDisabled = disabled || loading;

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 150);
        createRipple(e);
        onClick?.(e);
      }
    }, [isDisabled, onClick, createRipple]);

    const isCreateVariant = variant === 'create';

    // Custom variant styles
    const variantStyles = {
      create: 'bg-transparent border border-white text-white hover:bg-white/5 hover:border-white hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(255,255,255,0.3)]',
      gold: 'bg-fm-gold hover:bg-fm-gold/90 text-black font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(207,173,118,0.5)] hover:scale-105 active:scale-95',
      default: 'bg-white/5 border-white/30 hover:bg-fm-gold/20 hover:border-fm-gold hover:text-fm-gold transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(207,173,118,0.3)]',
      secondary: 'transition-all duration-200 hover:scale-105 active:scale-95',
      destructive: 'transition-all duration-200 hover:scale-105 active:scale-95',
    };

    const sizeClasses = {
      default: 'h-10 w-10',
      sm: 'h-8 w-8',
      lg: 'h-12 w-12',
    };

    const iconSizeClasses = {
      default: 'w-5 h-5',
      sm: 'w-4 h-4',
      lg: 'w-6 h-6',
    };

    const button = (
      <Button
        ref={ref}
        variant={isCreateVariant || variant === 'gold' ? 'default' : variant === 'default' ? 'outline' : variant === 'secondary' ? 'ghost' : variant}
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          'relative overflow-hidden p-0 group',
          sizeClasses[size],
          isCreateVariant && variantStyles.create,
          variant === 'gold' && variantStyles.gold,
          variant === 'default' && !isCreateVariant && variantStyles.default,
          variant === 'secondary' && variantStyles.secondary,
          variant === 'destructive' && variantStyles.destructive,
          isPressed && 'scale-95',
          className
        )}
        asChild={asChild}
        {...props}
      >
        <>
          {loading ? (
            <Loader2 className={cn('animate-spin', iconSizeClasses[size])} />
          ) : (
            <div className="relative flex items-center justify-center w-full h-full">
              <Icon className={cn('transition-transform duration-200 group-hover:scale-110', iconSizeClasses[size])} />
              {isCreateVariant && (
                <Plus className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-white text-black p-0.5 transition-colors duration-200 group-hover:bg-fm-gold" />
              )}
            </div>
          )}
          {/* Ripple effects */}
          {ripples.map(ripple => (
            <span
              key={ripple.id}
              className="absolute rounded-full bg-white/30 animate-ripple"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: 10,
                height: 10,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
        </>
      </Button>
    );

    if (tooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  }
);

FmCommonIconButton.displayName = 'FmCommonIconButton';
