import { Suspense } from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { LazyLoadFallback } from '@/components/app';
import { Wallet, TicketView, OrderTickets } from './lazyComponents';
import Orders from '@/pages/Orders';

/**
 * Wallet and order routes for managing tickets and purchases.
 * All routes require authentication.
 */
export const walletRoutes = (
  <>
    {/* Orders list (no auth required to view) */}
    <Route path='/orders' element={<Orders />} />

    {/* Order tickets detail */}
    <Route
      path='/orders/:orderId/tickets'
      element={
        <ProtectedRoute>
          <Suspense fallback={<LazyLoadFallback />}>
            <OrderTickets />
          </Suspense>
        </ProtectedRoute>
      }
    />

    {/* Wallet */}
    <Route
      path='/wallet'
      element={
        <ProtectedRoute>
          <Suspense fallback={<LazyLoadFallback />}>
            <Wallet />
          </Suspense>
        </ProtectedRoute>
      }
    />

    {/* Individual ticket view */}
    <Route
      path='/wallet/tickets/:ticketId'
      element={
        <ProtectedRoute>
          <Suspense fallback={<LazyLoadFallback />}>
            <TicketView />
          </Suspense>
        </ProtectedRoute>
      }
    />
  </>
);
