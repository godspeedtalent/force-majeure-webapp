import { CardElement } from '@stripe/react-stripe-js';
import { cn } from '@/shared';

interface StripeCardInputProps {
  className?: string;
  /** When true, disables Stripe Link autofill for manual card entry */
  disableLink?: boolean;
}

/**
 * StripeCardInput - Styled Stripe CardElement
 *
 * A pre-styled wrapper around Stripe's CardElement that matches
 * the application's design system.
 *
 * @param disableLink - Set to true to disable Stripe Link autofill
 */
export const StripeCardInput = ({ className, disableLink = false }: StripeCardInputProps) => {
  return (
    <div
      className={cn(
        'p-3 border border-border rounded-none bg-background transition-colors',
        'hover:border-fm-gold/50 focus-within:border-fm-gold focus-within:ring-1 focus-within:ring-fm-gold/30',
        className
      )}
    >
      <CardElement
        // Use key to force remount when disableLink changes
        key={disableLink ? 'manual' : 'link'}
        options={{
          disableLink,
          style: {
            base: {
              fontSize: '16px',
              color: 'hsl(var(--foreground))',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              '::placeholder': {
                color: 'hsl(var(--muted-foreground))',
              },
            },
            invalid: {
              color: 'hsl(var(--destructive))',
            },
          },
        }}
      />
    </div>
  );
};
