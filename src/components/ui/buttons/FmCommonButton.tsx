import { forwardRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/shared/utils/utils';
import { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useRipple } from '@/hooks/useRipple';

interface FmCommonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'gold';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children: React.ReactNode;
  asChild?: boolean;
}

/**
 * General-purpose button component with consistent Force Majeure styling
 * Enhanced with click ripple effect and scale animation for dopamine-inducing UX
 * Supports multiple variants, icons, and loading states
 */
export const FmCommonButton = forwardRef<HTMLButtonElement, FmCommonButtonProps>(
  (
    {
      variant = 'default',
      size = 'default',
      icon: Icon,
      iconPosition = 'left',
      loading = false,
      children,
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
        // Trigger press animation
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 150);

        // Create ripple effect
        createRipple(e);

        // Call original onClick
        onClick?.(e);
      }
    }, [isDisabled, onClick, createRipple]);

    // Custom variant styles with enhanced animations
    const variantStyles = {
      gold: 'bg-fm-gold hover:bg-fm-gold/90 text-black font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(207,173,118,0.5)] hover:scale-105 active:scale-95',
      default: 'transition-all duration-200 hover:scale-105 active:scale-95',
      outline: 'bg-white/5 border-white/30 hover:bg-fm-gold/20 hover:border-fm-gold hover:text-fm-gold transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(207,173,118,0.3)]',
      ghost: 'transition-all duration-200 hover:scale-105 active:scale-95',
      destructive: 'transition-all duration-200 hover:scale-105 active:scale-95',
    };

    return (
      <Button
        ref={ref}
        variant={variant === 'gold' ? 'default' : variant}
        size={size}
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          'relative overflow-hidden',
          variant === 'gold' && variantStyles.gold,
          variant === 'outline' && variantStyles.outline,
          variant === 'default' && variantStyles.default,
          variant === 'ghost' && variantStyles.ghost,
          variant === 'destructive' && variantStyles.destructive,
          isPressed && 'scale-95',
          className
        )}
        asChild={asChild}
        {...props}
      >
        <>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {!loading && Icon && iconPosition === 'left' && (
            <Icon className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
          )}
          <span className="relative z-10">{children}</span>
          {!loading && Icon && iconPosition === 'right' && (
            <Icon className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:scale-110" />
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
  }
);

FmCommonButton.displayName = 'FmCommonButton';
