import { jsx as _jsx } from "react/jsx-runtime";
import { CardElement } from '@stripe/react-stripe-js';
import { cn } from '@/shared';
/**
 * StripeCardInput - Styled Stripe CardElement
 *
 * A pre-styled wrapper around Stripe's CardElement that matches
 * the application's design system.
 */
export const StripeCardInput = ({ className }) => {
    return (_jsx("div", { className: cn('p-3 border border-border rounded-lg bg-background transition-colors', 'hover:border-fm-gold/50 focus-within:border-fm-gold focus-within:ring-1 focus-within:ring-fm-gold/30', className), children: _jsx(CardElement, { options: {
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
            } }) }));
};
