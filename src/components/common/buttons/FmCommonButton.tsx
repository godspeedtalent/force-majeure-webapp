import React, { forwardRef, useState, useCallback } from 'react';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@/shared';
import { LucideIcon } from 'lucide-react';
import { useRipple } from '@/hooks/useRipple';

// Helper to check if something is a renderable React component (function or forwardRef)
// - Function components: typeof === 'function'
// - forwardRef/memo components: objects with `$$typeof` and `render` properties
const isReactComponent = (component: unknown): component is React.ComponentType<any> => {
  return (
    typeof component === 'function' ||
    (typeof component === 'object' &&
      component !== null &&
      '$$typeof' in component &&
      'render' in (component as Record<string, unknown>))
  );
};

interface FmCommonButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'destructive-outline' | 'gold';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  icon?: LucideIcon | React.ReactNode;
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
export const FmCommonButton = forwardRef<
  HTMLButtonElement,
  FmCommonButtonProps
>(
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

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!isDisabled) {
          // Trigger press animation
          setIsPressed(true);
          setTimeout(() => setIsPressed(false), 150);

          // Create ripple effect
          createRipple(e);

          // Call original onClick
          onClick?.(e);
        }
      },
      [isDisabled, onClick, createRipple]
    );

    // Custom variant styles with enhanced animations
    const variantStyles = {
      gold: 'bg-fm-gold hover:bg-fm-gold/90 text-black font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(207,173,118,0.5)] hover:scale-105 active:scale-95',
      default:
        'bg-white/5 border-white/30 hover:bg-fm-gold/20 hover:border-fm-gold hover:text-fm-gold transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(207,173,118,0.3)]',
      secondary:
        'hover:bg-fm-gold/10 hover:border-fm-gold hover:text-fm-gold transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(207,173,118,0.3)]',
      destructive:
        'transition-all duration-200 hover:scale-105 active:scale-95',
      'destructive-outline':
        'bg-transparent border border-destructive text-destructive hover:bg-destructive/10 hover:border-destructive transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_hsl(var(--destructive)/0.3)]',
    };

    return (
      <Button
        ref={ref}
        variant={
          variant === 'gold'
            ? 'default'
            : variant === 'default' || variant === 'destructive-outline'
              ? 'outline'
              : variant === 'secondary'
                ? 'ghost'
                : variant
        }
        size={size}
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          'relative overflow-hidden',
          variant === 'gold' && variantStyles.gold,
          variant === 'default' && variantStyles.default,
          variant === 'secondary' && variantStyles.secondary,
          variant === 'destructive' && variantStyles.destructive,
          variant === 'destructive-outline' && variantStyles['destructive-outline'],
          isPressed && 'scale-95',
          className
        )}
        asChild={asChild}
        {...props}
      >
        <>
          {loading && <div className='w-4 h-4 mr-2 animate-spin rounded-full border-2 border-fm-gold border-b-transparent flex-shrink-0' />}
          {!loading && Icon && iconPosition === 'left' && (
            isReactComponent(Icon) ? (
              <Icon className='w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110 flex-shrink-0' />
            ) : React.isValidElement(Icon) ? (
              <span className='w-4 h-4 mr-2 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 flex-shrink-0'>
                {Icon}
              </span>
            ) : null
          )}
          <span className='relative z-10 whitespace-nowrap inline-flex items-center'>{children}</span>
          {!loading && Icon && iconPosition === 'right' && (
            isReactComponent(Icon) ? (
              <Icon className='w-4 h-4 ml-2 transition-transform duration-200 group-hover:scale-110 flex-shrink-0' />
            ) : React.isValidElement(Icon) ? (
              <span className='w-4 h-4 ml-2 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 flex-shrink-0'>
                {Icon}
              </span>
            ) : null
          )}
          {/* Ripple effects */}
          {ripples.map(ripple => (
            <span
              key={ripple.id}
              className='absolute rounded-full bg-fm-gold/40 animate-ripple'
              style={{
                left: ripple.x,
                top: ripple.y,
                width: 10,
                height: 10,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </>
      </Button>
    );
  }
);

FmCommonButton.displayName = 'FmCommonButton';
