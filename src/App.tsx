import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AdminConfig from './pages/AdminConfig';
import Auth from './pages/Auth';
import CheckoutCancel from './pages/CheckoutCancel';
import CheckoutSuccess from './pages/CheckoutSuccess';
import ComingSoon from './pages/ComingSoon';
import EventDetails from './pages/EventDetails';
import Index from './pages/Index';
import Orders from './pages/Orders';
import DemoIndex from './pages/demo/DemoIndex';
import EventCheckout from './pages/demo/EventCheckout';
import EventCheckoutConfirmation from './pages/demo/EventCheckoutConfirmation';
import EmailTemplateDemo from './pages/demo/EmailTemplateDemo';
import EventManagement from './pages/EventManagement';
import TestingIndex from './pages/testing/TestingIndex';
import CheckoutFlowTests from './pages/testing/CheckoutFlowTests';
import MemberHome from './pages/members/MemberHome';
import Statistics from './pages/admin/Statistics';
import AdminControls from './pages/admin/AdminControls';

import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { DemoProtectedRoute } from '@/components/routing/DemoProtectedRoute';
import { Toaster as Sonner } from '@/components/ui/shadcn/sonner';
import { Toaster } from '@/components/ui/shadcn/toaster';
import { TooltipProvider } from '@/components/ui/shadcn/tooltip';
import Merch from './pages/Merch';

import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext';
import { AuthProvider } from '@/features/auth/services/AuthContext';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';
import { DevToolsDrawer } from '@/components/DevTools/DevToolsDrawer';
import { DevToolsProvider } from '@/contexts/DevToolsContext';
import { CheckoutProvider } from '@/contexts/CheckoutContext';
import { GlobalSearchProvider, useGlobalSearch } from '@/contexts/GlobalSearchContext';
import { GlobalSearch } from '@/components/search/GlobalSearch';

import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import ProxyToken from './pages/ProxyToken';
import Scavenger from './pages/Scavenger';

const queryClient = new QueryClient();

const GlobalSearchWrapper = () => {
  const { isOpen, closeSearch } = useGlobalSearch();
  return <GlobalSearch isOpen={isOpen} onClose={closeSearch} />;
};

const AppRoutes = () => {
  const { data: flags, isLoading } = useFeatureFlags();

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <Loader2 className='w-8 h-8 animate-spin text-fm-gold' />
      </div>
    );
  }

  const comingSoonMode = flags?.coming_soon_mode ?? false;

  return (
    <Routes>
      {/* Always-accessible routes - highest priority */}
      <Route path='/auth' element={<Auth />} />
      <Route path='/scavenger' element={<Scavenger />} />
      <Route path='/proxy-token' element={<ProxyToken />} />

      {/* Coming Soon Mode - Show only coming soon page for other routes */}
      {comingSoonMode ? (
        <>
          <Route path='/' element={<ComingSoon />} />
          <Route path='*' element={<Navigate to='/' replace />} />
        </>
      ) : (
        <>
          {/* Normal App Routes */}
          <Route path='/' element={<Index />} />
          <Route path='/event/:id' element={<EventDetails />} />
          <Route path='/event/:id/manage' element={<EventManagement />} />
          
          {/* Conditionally render merch route based on feature flag */}
          {flags?.merch_store && <Route path='/merch' element={<Merch />} />}
          
          {/* Conditionally render member profiles route based on feature flag */}
          {flags?.member_profiles && <Route path='/members/home' element={<MemberHome />} />}
          
          <Route path='/profile' element={<Profile />} />
          <Route path='/admin' element={<AdminConfig />} />
          <Route path='/orders' element={<Orders />} />
          
          {/* Checkout Routes */}
          <Route path='/checkout/success' element={<CheckoutSuccess />} />
          <Route path='/checkout/cancel' element={<CheckoutCancel />} />

          {/* Demo Routes - Protected by role and feature flag */}
          <Route
            path='/demo'
            element={
              <DemoProtectedRoute>
                <DemoIndex />
              </DemoProtectedRoute>
            }
          />
          <Route
            path='/demo/event-checkout'
            element={
              <DemoProtectedRoute>
                <EventCheckout />
              </DemoProtectedRoute>
            }
          />
          <Route
            path='/demo/event-checkout-confirmation'
            element={
              <DemoProtectedRoute>
                <EventCheckoutConfirmation />
              </DemoProtectedRoute>
            }
          />
          <Route
            path='/demo/email-template'
            element={
              <DemoProtectedRoute>
                <EmailTemplateDemo />
              </DemoProtectedRoute>
            }
          />
          <Route
            path='/testing'
            element={
              <DemoProtectedRoute>
                <TestingIndex />
              </DemoProtectedRoute>
            }
          />
          <Route
            path='/testing/checkout-flow'
            element={
              <DemoProtectedRoute>
                <CheckoutFlowTests />
              </DemoProtectedRoute>
            }
          />

          {/* Admin Routes - Protected by role */}
          <Route
            path='/admin/statistics'
            element={
              <DemoProtectedRoute>
                <Statistics />
              </DemoProtectedRoute>
            }
          />
          <Route
            path='/admin/controls'
            element={
              <DemoProtectedRoute>
                <AdminControls />
              </DemoProtectedRoute>
            }
          />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path='*' element={<NotFound />} />
        </>
      )}
    </Routes>
  );
};

const App = () => {
  // Force dark mode by adding class to html element
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <DevToolsProvider>
          <AuthProvider>
            <GlobalSearchProvider>
              <MusicPlayerProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <CheckoutProvider>
                      <AppRoutes />
                      <DevToolsDrawer />
                      <GlobalSearchWrapper />
                    </CheckoutProvider>
                  </BrowserRouter>
                </TooltipProvider>
              </MusicPlayerProvider>
            </GlobalSearchProvider>
          </AuthProvider>
        </DevToolsProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
