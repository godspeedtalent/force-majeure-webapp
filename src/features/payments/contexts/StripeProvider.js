import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { logger } from '@/shared';
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!STRIPE_PUBLISHABLE_KEY) {
    logger.warn('VITE_STRIPE_PUBLISHABLE_KEY is not set. Stripe will not work.');
}
let stripePromise = null;
const getStripe = () => {
    if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
        stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
    }
    return stripePromise;
};
/**
 * StripeProvider - Wraps the application with Stripe Elements context
 *
 * This provider must wrap any components that use Stripe functionality.
 * It loads the Stripe.js library and provides it to child components.
 */
export const StripeProvider = ({ children }) => {
    const [stripe, setStripe] = useState(null);
    useEffect(() => {
        setStripe(getStripe());
    }, []);
    if (!STRIPE_PUBLISHABLE_KEY) {
        logger.warn('Stripe provider is disabled - no publishable key found');
        return _jsx(_Fragment, { children: children });
    }
    // Always render with Elements wrapper, even if stripe promise is null initially
    // The Elements component will handle the loading state internally
    return _jsx(Elements, { stripe: stripe, children: children });
};
