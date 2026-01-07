import { forwardRef, useState, useCallback } from 'react';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@/shared';
import { LucideIcon } from 'lucide-react';
import { useRipple } from '@/hooks/useRipple';

export interface FmCommonSlidingIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'gold';
  size?: 'default' | 'sm' | 'lg';
  icon: LucideIcon;
  label: string;
  loading?: boolean;
  /** Accessible label for screen readers. Falls back to label if not provided. */
  'aria-label'?: string;
}

/**
 * Icon button that slides out to reveal a label on hover
 * Animatedly retracts on mouse exit
 * Perfect for actions like "Manage" where you want a compact button that reveals more context
 */
export const FmCommonSlidingIconButton = forwardRef<
  HTMLButtonElement,
  FmCommonSlidingIconButtonProps
>(
  (
    {
      variant = 'default',
      size = 'default',
      icon: Icon,
      label,
      loading = false,
      'aria-label': ariaLabel,
      className,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const accessibleLabel = ariaLabel || label;
    const [isPressed, setIsPressed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const { ripples, createRipple } = useRipple();
    const isDisabled = disabled || loading;

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!isDisabled) {
          setIsPressed(true);
          setTimeout(() => setIsPressed(false), 150);
          createRipple(e);
          onClick?.(e);
        }
      },
      [isDisabled, onClick, createRipple]
    );

    const handleMouseEnter = useCallback(() => {
      if (!isDisabled) {
        setIsHovered(true);
      }
    }, [isDisabled]);

    const handleMouseLeave = useCallback(() => {
      setIsHovered(false);
    }, []);

    // Custom variant styles
    const variantStyles = {
      gold: 'bg-fm-gold hover:bg-fm-gold/90 text-black font-medium hover:shadow-[0_0_20px_rgba(207,173,118,0.5)]',
      default:
        'bg-white/5 border-white/30 hover:bg-fm-gold/20 hover:border-fm-gold hover:text-fm-gold hover:shadow-[0_0_12px_rgba(207,173,118,0.3)]',
      secondary: 'hover:bg-fm-gold/10 hover:border-fm-gold hover:text-fm-gold',
      destructive:
        'bg-transparent border border-destructive text-destructive hover:bg-destructive hover:text-black hover:border-destructive hover:shadow-[0_0_12px_hsl(var(--destructive)/0.3)]',
    };

    const sizeClasses = {
      default: 'h-10',
      sm: 'h-8',
      lg: 'h-12',
    };

    const iconSizeClasses = {
      default: 'w-5 h-5',
      sm: 'w-4 h-4',
      lg: 'w-6 h-6',
    };

    const paddingClasses = {
      default: isHovered ? 'px-4' : 'px-2.5',
      sm: isHovered ? 'px-3' : 'px-2',
      lg: isHovered ? 'px-5' : 'px-3',
    };

    return (
      <Button
        ref={ref}
        variant={
          variant === 'gold'
            ? 'default'
            : variant === 'default' || variant === 'destructive'
              ? 'outline'
              : variant === 'secondary'
                ? 'ghost'
                : 'outline'
        }
        disabled={isDisabled}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'relative overflow-hidden group',
          'transition-all duration-300 ease-out',
          sizeClasses[size],
          paddingClasses[size],
          variantStyles[variant],
          isPressed && 'scale-95',
          // Mobile touch feedback (hover-like effects on tap for touch devices)
          variant === 'destructive' ? 'fm-touch-feedback-destructive' : 'fm-touch-feedback',
          className
        )}
        aria-label={accessibleLabel}
        {...props}
      >
        <>
          {loading ? (
            <div
              className={cn(
                'animate-spin rounded-full border-2 border-fm-gold border-b-transparent',
                iconSizeClasses[size]
              )}
            />
          ) : (
            <div className='flex items-center gap-2'>
              <Icon
                className={cn(
                  'flex-shrink-0 transition-transform duration-200',
                  iconSizeClasses[size]
                )}
              />
              <span
                className={cn(
                  'whitespace-nowrap overflow-hidden transition-all duration-300 ease-out font-medium',
                  isHovered
                    ? 'max-w-[100px] opacity-100'
                    : 'max-w-0 opacity-0'
                )}
              >
                {label}
              </span>
            </div>
          )}
          {/* Ripple effects */}
          {ripples.map(ripple => (
            <span
              key={ripple.id}
              className='absolute rounded-full bg-white/30 animate-ripple'
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

FmCommonSlidingIconButton.displayName = 'FmCommonSlidingIconButton';
