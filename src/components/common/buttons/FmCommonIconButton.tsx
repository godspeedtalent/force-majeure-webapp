import { forwardRef, useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@/shared';
import { LucideIcon, Plus } from 'lucide-react';
import { useRipple } from '@/hooks/useRipple';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/shadcn/tooltip';
import {
  FmCommonContextMenu,
  ContextMenuAction,
} from '@/components/common/modals/FmCommonContextMenu';

export interface FmCommonIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'gold' | 'create' | 'success';
  size?: 'default' | 'sm' | 'lg';
  icon: LucideIcon;
  loading?: boolean;
  tooltip?: string;
  /** Accessible label for screen readers. Falls back to tooltip if not provided. */
  'aria-label'?: string;
  asChild?: boolean;
  /** Context menu actions (shown on right-click or press-and-hold) */
  contextMenuActions?: ContextMenuAction<void>[];
  /** Press-and-hold delay in ms (default: 500) */
  pressHoldDelay?: number;
}

/**
 * Icon-only button component with optional floating + indicator for create actions
 * Enhanced with click ripple effect and scale animation
 * Automatically wraps in tooltip if tooltip prop is provided
 * Supports press-and-hold / right-click context menu when contextMenuActions provided
 */
export const FmCommonIconButton = forwardRef<
  HTMLButtonElement,
  FmCommonIconButtonProps
>(
  (
    {
      variant = 'default',
      size = 'default',
      icon: Icon,
      loading = false,
      tooltip,
      'aria-label': ariaLabel,
      className,
      disabled,
      asChild,
      onClick,
      contextMenuActions = [],
      pressHoldDelay = 500,
      ...props
    },
    ref
  ) => {
    // Use explicit aria-label, fall back to tooltip for accessibility
    const accessibleLabel = ariaLabel || tooltip;
    const [isPressed, setIsPressed] = useState(false);
    const [isLongPressing, setIsLongPressing] = useState(false);
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const { ripples, createRipple } = useRipple();
    const isDisabled = disabled || loading;

    // Cleanup timer on unmount
    useEffect(() => {
      return () => {
        if (pressTimerRef.current) {
          clearTimeout(pressTimerRef.current);
        }
      };
    }, []);

    // Handle press-and-hold for context menu
    const handleMouseDown = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (contextMenuActions.length === 0 || isDisabled) return;
        if (e.button !== 0) return; // Only left click

        setIsLongPressing(true);
        pressTimerRef.current = setTimeout(() => {
          setContextMenuOpen(true);
          setIsLongPressing(false);
        }, pressHoldDelay);
      },
      [contextMenuActions.length, pressHoldDelay, isDisabled]
    );

    const handleMouseUp = useCallback(() => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
      setIsLongPressing(false);
    }, []);

    const handleMouseLeave = useCallback(() => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
      setIsLongPressing(false);
    }, []);

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        // Don't fire click if we were long pressing or context menu is open
        if (!isDisabled && !isLongPressing && !contextMenuOpen) {
          setIsPressed(true);
          setTimeout(() => setIsPressed(false), 150);
          createRipple(e);
          onClick?.(e);
        }
      },
      [isDisabled, isLongPressing, contextMenuOpen, onClick, createRipple]
    );

    const isCreateVariant = variant === 'create';

    // Custom variant styles
    const variantStyles = {
      create:
        'bg-transparent border border-white text-white hover:bg-white/5 hover:border-white hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(255,255,255,0.3)]',
      gold: 'bg-fm-gold/20 backdrop-blur-sm border border-fm-gold text-fm-gold font-medium transition-all duration-200 hover:bg-fm-gold/30 hover:shadow-[0_0_20px_rgba(207,173,118,0.5)] hover:scale-105 active:scale-95',
      success: 'bg-fm-success/20 backdrop-blur-sm border border-fm-success text-fm-success font-medium transition-all duration-200 hover:bg-fm-success/30 hover:shadow-[0_0_20px_rgba(125,155,114,0.5)] hover:scale-105 active:scale-95',
      default:
        'bg-white/5 border-white/30 hover:bg-fm-gold/20 hover:border-fm-gold hover:text-fm-gold transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(207,173,118,0.3)]',
      secondary: 'transition-all duration-200 hover:scale-105 active:scale-95',
      destructive:
        'bg-destructive/20 backdrop-blur-sm border border-destructive text-destructive hover:bg-destructive hover:text-black hover:border-destructive transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_0_12px_hsl(var(--destructive)/0.2)] hover:shadow-[0_0_20px_hsl(var(--destructive)/0.4)]',
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
        variant={
          isCreateVariant || variant === 'gold' || variant === 'success'
            ? 'default'
            : variant === 'default' || variant === 'destructive'
              ? 'outline'
              : variant === 'secondary'
                ? 'ghost'
                : 'outline'
        }
        disabled={isDisabled}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'relative overflow-hidden p-0 group',
          sizeClasses[size],
          isCreateVariant && variantStyles.create,
          variant === 'gold' && variantStyles.gold,
          variant === 'success' && variantStyles.success,
          variant === 'default' && !isCreateVariant && variantStyles.default,
          variant === 'secondary' && variantStyles.secondary,
          variant === 'destructive' && variantStyles.destructive,
          isPressed && 'scale-95',
          isLongPressing && 'scale-95 transition-transform duration-100',
          // Mobile touch feedback (hover-like effects on tap for touch devices)
          variant === 'destructive' ? 'fm-touch-feedback-destructive' : 'fm-touch-feedback',
          className
        )}
        asChild={asChild}
        aria-label={accessibleLabel}
        {...props}
      >
        <>
          {loading ? (
            <div className={cn('animate-spin rounded-full border-2 border-fm-gold border-b-transparent', iconSizeClasses[size])} />
          ) : (
            <div className='relative flex items-center justify-center w-full h-full'>
              <Icon
                className={cn(
                  'transition-transform duration-200 group-hover:scale-110',
                  iconSizeClasses[size]
                )}
              />
              {isCreateVariant && (
                <Plus className='absolute -top-0.5 -right-0.5 w-3 h-3 bg-white text-black p-0.5 transition-colors duration-200 group-hover:bg-fm-gold' />
              )}
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

    // Wrap with tooltip if provided
    const buttonWithTooltip = tooltip ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      button
    );

    // Wrap with context menu if actions provided
    if (contextMenuActions.length > 0) {
      return (
        <FmCommonContextMenu
          actions={contextMenuActions}
          data={undefined}
          onOpenChange={setContextMenuOpen}
        >
          {buttonWithTooltip}
        </FmCommonContextMenu>
      );
    }

    return buttonWithTooltip;
  }
);

FmCommonIconButton.displayName = 'FmCommonIconButton';
