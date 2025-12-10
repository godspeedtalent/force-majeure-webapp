import { cn } from '@force-majeure/shared';

interface FmCommonPriceDisplayProps {
  /** Amount in cents */
  amountCents: number;
  currency?: string;
  /** Show original price with strikethrough */
  originalAmountCents?: number;
  /** Show discount badge */
  showDiscount?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /** Show "Free" text for zero amounts */
  showFreeText?: boolean;
}

const sizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg font-semibold',
};

const formatPrice = (cents: number, currency: string = '$'): string => {
  const dollars = cents / 100;
  return `${currency}${dollars.toFixed(2)}`;
};

const calculateDiscount = (original: number, current: number): number => {
  return Math.round(((original - current) / original) * 100);
};

/**
 * A reusable component for displaying prices with consistent formatting
 * Supports discounts, strikethrough, and various sizes
 */
export function FmCommonPriceDisplay({
  amountCents,
  currency = '$',
  originalAmountCents,
  showDiscount = true,
  size = 'md',
  className,
  showFreeText = true,
}: FmCommonPriceDisplayProps) {
  const hasDiscount = originalAmountCents && originalAmountCents > amountCents;
  const discountPercent = hasDiscount
    ? calculateDiscount(originalAmountCents, amountCents)
    : 0;

  if (amountCents === 0 && showFreeText) {
    return (
      <span
        className={cn('font-medium text-fm-gold', sizeClasses[size], className)}
      >
        Free
      </span>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {hasDiscount && (
        <span
          className={cn(
            'text-muted-foreground line-through',
            sizeClasses[size]
          )}
        >
          {formatPrice(originalAmountCents, currency)}
        </span>
      )}
      <span className={cn('font-medium', sizeClasses[size])}>
        {formatPrice(amountCents, currency)}
      </span>
      {hasDiscount && showDiscount && (
        <span className='text-xs font-medium text-fm-gold bg-fm-gold/10 px-2 py-0.5 rounded'>
          {discountPercent}% off
        </span>
      )}
    </div>
  );
}
