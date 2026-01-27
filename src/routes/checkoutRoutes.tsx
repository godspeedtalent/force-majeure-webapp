import { Suspense } from 'react';
import { Route } from 'react-router-dom';
import { LazyLoadFallback } from '@/components/app';
import { ClaimTicketPage } from './lazyComponents';
import CheckoutSuccess from '@/pages/CheckoutSuccess';
import CheckoutCancel from '@/pages/CheckoutCancel';

/**
 * Checkout flow routes including success, cancel, and ticket claim pages.
 */
export const checkoutRoutes = (
  <>
    {/* Checkout result pages */}
    <Route path='/checkout/success' element={<CheckoutSuccess />} />
    <Route path='/checkout/cancel' element={<CheckoutCancel />} />

    {/* Claim Ticket Route (for comp tickets) */}
    <Route
      path='/claim/:claimToken'
      element={
        <Suspense fallback={<LazyLoadFallback />}>
          <ClaimTicketPage />
        </Suspense>
      }
    />
  </>
);
