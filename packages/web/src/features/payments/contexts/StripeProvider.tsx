import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { ReactNode, useEffect, useState } from 'react';
import { logger } from '@force-majeure/shared';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  logger.warn('VITE_STRIPE_PUBLISHABLE_KEY is not set. Stripe will not work.');
}

let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = () => {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

interface StripeProviderProps {
  children: ReactNode;
}

/**
 * StripeProvider - Wraps the application with Stripe Elements context
 *
 * This provider must wrap any components that use Stripe functionality.
 * It loads the Stripe.js library and provides it to child components.
 */
export const StripeProvider = ({ children }: StripeProviderProps) => {
  const [stripe, setStripe] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    setStripe(getStripe());
  }, []);

  if (!STRIPE_PUBLISHABLE_KEY) {
    logger.warn('Stripe provider is disabled - no publishable key found');
    return <>{children}</>;
  }

  // Always render with Elements wrapper, even if stripe promise is null initially
  // The Elements component will handle the loading state internally
  return <Elements stripe={stripe}>{children}</Elements>;
};
