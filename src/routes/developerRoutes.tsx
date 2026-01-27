import { Suspense } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { DemoProtectedRoute } from '@/components/routing/DemoProtectedRoute';
import { LazyLoadFallback } from '@/components/app';
import {
  DeveloperHome,
  TicketFlowTests,
  EventCheckout,
  EventCheckoutConfirmation,
  EmailTemplateDemo,
  ArtistSignupDemo,
  StoryDesigner,
  SquareSpinnersDemo,
  TestingIndex,
  CheckoutFlowTests,
} from './lazyComponents';

/**
 * Developer routes protected by developer/admin roles.
 * Includes dev tools, demos, and testing pages.
 */
export const developerRoutes = (
  <>
    {/* Main developer home */}
    <Route
      path='/developer'
      element={
        <DemoProtectedRoute>
          <Suspense fallback={<LazyLoadFallback />}>
            <DeveloperHome />
          </Suspense>
        </DemoProtectedRoute>
      }
    />

    {/* Redirects for old routes to unified developer home */}
    <Route path='/developer/database' element={<Navigate to='/developer?tab=db_overview' replace />} />
    <Route path='/developer/documentation' element={<Navigate to='/developer?tab=dev_docs' replace />} />
    <Route path='/developer/dashboards' element={<Navigate to='/developer?tab=dash_recordings' replace />} />
    <Route path='/developer/recording-analytics' element={<Navigate to='/developer?tab=dash_recordings' replace />} />
    <Route path='/developer/demo' element={<Navigate to='/developer?tab=dev_demo' replace />} />

    {/* Ticket flow tests */}
    <Route
      path='/developer/ticket-flow'
      element={
        <DemoProtectedRoute>
          <Suspense fallback={<LazyLoadFallback />}>
            <TicketFlowTests />
          </Suspense>
        </DemoProtectedRoute>
      }
    />

    {/* Demo pages */}
    <Route
      path='/developer/demo/event-checkout'
      element={
        <DemoProtectedRoute>
          <Suspense fallback={<LazyLoadFallback />}>
            <EventCheckout />
          </Suspense>
        </DemoProtectedRoute>
      }
    />
    <Route
      path='/developer/demo/event-checkout-confirmation'
      element={
        <DemoProtectedRoute>
          <Suspense fallback={<LazyLoadFallback />}>
            <EventCheckoutConfirmation />
          </Suspense>
        </DemoProtectedRoute>
      }
    />
    <Route
      path='/developer/demo/email-template'
      element={
        <DemoProtectedRoute>
          <Suspense fallback={<LazyLoadFallback />}>
            <EmailTemplateDemo />
          </Suspense>
        </DemoProtectedRoute>
      }
    />
    <Route
      path='/developer/demo/artist-signup'
      element={
        <DemoProtectedRoute>
          <Suspense fallback={<LazyLoadFallback />}>
            <ArtistSignupDemo />
          </Suspense>
        </DemoProtectedRoute>
      }
    />
    <Route
      path='/developer/demo/story-designer'
      element={
        <DemoProtectedRoute>
          <Suspense fallback={<LazyLoadFallback />}>
            <StoryDesigner />
          </Suspense>
        </DemoProtectedRoute>
      }
    />
    <Route
      path='/developer/demo/square-spinners'
      element={
        <DemoProtectedRoute>
          <Suspense fallback={<LazyLoadFallback />}>
            <SquareSpinnersDemo />
          </Suspense>
        </DemoProtectedRoute>
      }
    />

    {/* Testing routes */}
    <Route
      path='/testing'
      element={
        <DemoProtectedRoute>
          <Suspense fallback={<LazyLoadFallback />}>
            <TestingIndex />
          </Suspense>
        </DemoProtectedRoute>
      }
    />
    <Route
      path='/testing/checkout-flow'
      element={
        <DemoProtectedRoute>
          <Suspense fallback={<LazyLoadFallback />}>
            <CheckoutFlowTests />
          </Suspense>
        </DemoProtectedRoute>
      }
    />
  </>
);
