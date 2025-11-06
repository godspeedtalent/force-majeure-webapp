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
import FmComponentsCatalog from './pages/developer/FmComponentsCatalog';
import EventManagement from './pages/EventManagement';
import TestingIndex from './pages/testing/TestingIndex';
import CheckoutFlowTests from './pages/testing/CheckoutFlowTests';
import MemberHome from './pages/members/MemberHome';
import Statistics from './pages/admin/Statistics';
import AdminControls from './pages/admin/AdminControls';
import DeveloperIndex from './pages/developer/DeveloperIndex';
import DeveloperCreateEventPage from './pages/developer/database/CreateEvent';
import DeveloperCreateArtistPage from './pages/developer/database/CreateArtist';
import DeveloperCreateVenuePage from './pages/developer/database/CreateVenue';
import OrganizationTools from './pages/organization/OrganizationTools';
import TicketScanning from './pages/organization/TicketScanning';

import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { DemoProtectedRoute } from '@/components/routing/DemoProtectedRoute';
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { Toaster as Sonner } from '@/components/common/shadcn/sonner';
import { Toaster } from '@/components/common/shadcn/toaster';
import { TooltipProvider } from '@/components/common/shadcn/tooltip';
import Merch from './pages/Merch';

import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext';
import { AuthProvider } from '@/features/auth/services/AuthContext';
import { useFeatureFlagHelpers } from '@/shared/hooks/useFeatureFlags';
import { FmToolbar } from '@/components/common/toolbar/FmToolbar';
import { ROLES } from '@/shared/auth/permissions';
import { FEATURE_FLAGS } from '@/shared/config/featureFlags';
import { CheckoutProvider } from '@/contexts/CheckoutContext';
import { GlobalSearchProvider, useGlobalSearch } from '@/contexts/GlobalSearchContext';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { StripeProvider } from '@/features/payments';

import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import ProxyToken from './pages/ProxyToken';
import Scavenger from './pages/Scavenger';

const queryClient = new QueryClient();

const GlobalSearchWrapper = () => {
  const { isOpen, closeSearch } = useGlobalSearch();
  return <GlobalSearch isOpen={isOpen} onClose={closeSearch} />;
};

const AppRoutes = () => {
  const { isFeatureEnabled, isLoading } = useFeatureFlagHelpers();

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <Loader2 className='w-8 h-8 animate-spin text-fm-gold' />
      </div>
    );
  }

  const comingSoonMode = isFeatureEnabled(FEATURE_FLAGS.COMING_SOON_MODE);

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
          {isFeatureEnabled(FEATURE_FLAGS.MERCH_STORE) && (
            <Route path='/merch' element={<Merch />} />
          )}
          
          {/* Conditionally render member profiles route based on feature flag */}
          {isFeatureEnabled(FEATURE_FLAGS.MEMBER_PROFILES) && (
            <Route path='/members/home' element={<MemberHome />} />
          )}

          <Route path='/profile' element={<Profile />} />
          <Route path='/profile/edit' element={<ProfileEdit />} />
          <Route 
            path='/admin' 
            element={
              <ProtectedRoute role={ROLES.ADMIN}>
                <AdminConfig />
              </ProtectedRoute>
            } 
          />
          <Route path='/orders' element={<Orders />} />
          
          {/* Checkout Routes */}
          <Route path='/checkout/success' element={<CheckoutSuccess />} />
          <Route path='/checkout/cancel' element={<CheckoutCancel />} />

          {/* Developer Routes - Protected by developer/admin roles */}
          <Route
            path='/developer'
            element={
              <DemoProtectedRoute>
                <DeveloperIndex />
              </DemoProtectedRoute>
            }
          />
          <Route
            path='/developer/components'
            element={
              <DemoProtectedRoute>
                <FmComponentsCatalog />
              </DemoProtectedRoute>
            }
          />

          <Route
            path='/developer/database/events/new'
            element={
              <DemoProtectedRoute>
                <DeveloperCreateEventPage />
              </DemoProtectedRoute>
            }
          />
          <Route
            path='/developer/database/artists/new'
            element={
              <DemoProtectedRoute>
                <DeveloperCreateArtistPage />
              </DemoProtectedRoute>
            }
          />
          <Route
            path='/developer/database/venues/new'
            element={
              <DemoProtectedRoute>
                <DeveloperCreateVenuePage />
              </DemoProtectedRoute>
            }
          />

          {/* Demo Routes - Now under /developer/demo */}
          <Route
            path='/developer/demo'
            element={
              <DemoProtectedRoute>
                <DemoIndex />
              </DemoProtectedRoute>
            }
          />
          <Route
            path='/developer/demo/event-checkout'
            element={
              <DemoProtectedRoute>
                <EventCheckout />
              </DemoProtectedRoute>
            }
          />
          <Route
            path='/developer/demo/event-checkout-confirmation'
            element={
              <DemoProtectedRoute>
                <EventCheckoutConfirmation />
              </DemoProtectedRoute>
            }
          />
          <Route
            path='/developer/demo/email-template'
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

          {/* Admin Routes - Protected by admin role only */}
          <Route
            path='/admin/statistics'
            element={
              <ProtectedRoute role={ROLES.ADMIN}>
                <Statistics />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin/controls'
            element={
              <ProtectedRoute role={ROLES.ADMIN}>
                <AdminControls />
              </ProtectedRoute>
            }
          />

          {/* Organization Routes */}
          <Route path='/organization/tools' element={<OrganizationTools />} />
          <Route path='/organization/scanning' element={<TicketScanning />} />

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
        <AuthProvider>
          <StripeProvider>
            <GlobalSearchProvider>
              <MusicPlayerProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <CheckoutProvider>
                      <AppRoutes />
                      <FmToolbar />
                      <GlobalSearchWrapper />
                    </CheckoutProvider>
                  </BrowserRouter>
                </TooltipProvider>
              </MusicPlayerProvider>
            </GlobalSearchProvider>
          </StripeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
