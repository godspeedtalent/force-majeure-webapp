import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared';

export interface FmInventoryProgressBarProps {
  /** Current sold/used count */
  sold: number;
  /** Total capacity */
  total: number;
  /** Reserved count (shown in different color, optional) */
  reserved?: number;
  /** Show labels (e.g., "50 of 100 remaining") */
  showLabels?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
  /** Show sold out badge when full */
  showSoldOutBadge?: boolean;
}

/**
 * FmInventoryProgressBar
 *
 * A progress bar specifically designed for showing inventory/capacity status.
 * Features:
 * - Color coding based on fill percentage (green → gold → red)
 * - Optional "SOLD OUT" badge when at 100%
 * - Shows "X remaining" or "X of Y sold" labels
 * - Supports reserved inventory display
 *
 * @example
 * ```tsx
 * <FmInventoryProgressBar
 *   sold={80}
 *   total={100}
 *   reserved={5}
 *   showLabels
 * />
 * ```
 */
export const FmInventoryProgressBar = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  FmInventoryProgressBarProps
>(({
  sold,
  total,
  reserved = 0,
  showLabels = true,
  size = 'md',
  className,
  showSoldOutBadge = true,
}, ref) => {
  const { t } = useTranslation('common');

  const available = Math.max(0, total - sold - reserved);
  const percentSold = total > 0 ? Math.round((sold / total) * 100) : 0;
  const percentReserved = total > 0 ? Math.round((reserved / total) * 100) : 0;
  const isSoldOut = available === 0 && total > 0;
  const isLowStock = total > 0 && available > 0 && available / total < 0.1;

  // Determine color based on fill percentage
  const getColorClass = () => {
    if (percentSold >= 100) return 'bg-fm-danger';
    if (percentSold >= 90) return 'bg-fm-danger/80';
    if (percentSold >= 70) return 'bg-fm-gold';
    return 'bg-green-500';
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Labels row */}
      {showLabels && (
        <div className={cn('flex justify-between items-center mb-1', labelSizeClasses[size])}>
          <span className="text-muted-foreground">
            {sold} / {total} {t('ticketStatus.ticketsSold').toLowerCase()}
          </span>
          <span className={cn(
            'font-medium',
            isSoldOut ? 'text-fm-danger' : isLowStock ? 'text-fm-gold' : 'text-muted-foreground'
          )}>
            {isSoldOut ? (
              showSoldOutBadge && (
                <span className="bg-fm-danger/20 text-fm-danger px-2 py-0.5 text-xs font-semibold uppercase">
                  {t('ticketStatus.soldOut')}
                </span>
              )
            ) : isLowStock ? (
              <span className="text-fm-gold">
                {t('ticketStatus.xRemaining', { count: available })}
              </span>
            ) : (
              <span>{available} {t('ticketStatus.remaining').toLowerCase()}</span>
            )}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          'relative w-full overflow-hidden bg-white/10 rounded-none',
          sizeClasses[size]
        )}
        value={percentSold}
      >
        {/* Reserved segment (if any) */}
        {reserved > 0 && (
          <div
            className="absolute h-full bg-fm-navy/50 transition-all"
            style={{
              width: `${percentReserved}%`,
              left: `${percentSold}%`,
            }}
          />
        )}

        {/* Sold segment */}
        <ProgressPrimitive.Indicator
          className={cn('h-full transition-all duration-500', getColorClass())}
          style={{ width: `${percentSold}%` }}
        />
      </ProgressPrimitive.Root>

      {/* Legend for reserved (if applicable) */}
      {reserved > 0 && showLabels && (
        <div className={cn('flex items-center gap-4 mt-1', labelSizeClasses[size])}>
          <div className="flex items-center gap-1">
            <div className={cn('w-3 h-3 rounded-none', getColorClass())} />
            <span className="text-muted-foreground text-xs">{t('ticketStatus.ticketsSold')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-none bg-fm-navy/50" />
            <span className="text-muted-foreground text-xs">
              {reserved} {t('ticketStatus.reserved').toLowerCase()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

FmInventoryProgressBar.displayName = 'FmInventoryProgressBar';
