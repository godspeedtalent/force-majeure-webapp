import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import Auth from './pages/Auth';
import CheckoutCancel from './pages/CheckoutCancel';
import CheckoutSuccess from './pages/CheckoutSuccess';
import ComingSoon from './pages/ComingSoon';
import Contact from './pages/Contact';
import EventDetails from './pages/EventDetails';
import EventTicketing from './pages/event/EventTicketingPage';
import Index from './pages/Index';
import Orders from './pages/Orders';
import EventManagement from './pages/EventManagement';
import MemberHome from './pages/members/MemberHome';
import OrganizationTools from './pages/organization/OrganizationTools';
import TicketScanning from './pages/organization/TicketScanning';

// Lazy load demo pages
const DemoIndex = lazy(() => import('./pages/demo/DemoIndex'));
const EventCheckout = lazy(() => import('./pages/demo/EventCheckout'));
const EventCheckoutConfirmation = lazy(() => import('./pages/demo/EventCheckoutConfirmation'));
const EmailTemplateDemo = lazy(() => import('./pages/demo/EmailTemplateDemo'));

// Lazy load developer pages
const DeveloperDatabase = lazy(() => import('./pages/developer/DeveloperDatabase'));
const DeveloperDocumentation = lazy(() => import('./pages/developer/DeveloperDocumentation'));
const TicketFlowTests = lazy(() => import('./pages/developer/TicketFlowTests'));
const DeveloperCreateEventPage = lazy(() => import('./pages/developer/database/CreateEvent'));
const DeveloperCreateArtistPage = lazy(() => import('./pages/developer/database/CreateArtist'));
const DeveloperCreateVenuePage = lazy(() => import('./pages/developer/database/CreateVenue'));
const DeveloperCreateOrganizationPage = lazy(() => import('./pages/developer/database/CreateOrganization'));
const DeveloperIndex = lazy(() => import('./pages/developer/DeveloperIndex'));
const ArtistSignupDemo = lazy(() => import('./pages/developer/ArtistSignupDemo'));

// Lazy load admin pages
const Statistics = lazy(() => import('./pages/admin/Statistics'));
const AdminControls = lazy(() => import('./pages/admin/AdminControls'));
const ActivityLogs = lazy(() => import('./pages/admin/ActivityLogs'));
const OrganizationDetails = lazy(() => import('./pages/admin/OrganizationDetails'));
const UserDetails = lazy(() => import('./pages/admin/UserDetails'));
const GalleryManagement = lazy(() => import('./pages/admin/GalleryManagement'));

// Lazy load venue and artist pages
const VenueDetails = lazy(() => import('./pages/venues/VenueDetails'));
const VenueManagement = lazy(() => import('./pages/venues/VenueManagement'));
const ArtistDetails = lazy(() => import('./pages/artists/ArtistDetails'));
const ArtistManagement = lazy(() => import('./pages/artists/ArtistManagement'));

// Lazy load testing pages
const TestingIndex = lazy(() => import('./pages/testing/TestingIndex'));
const CheckoutFlowTests = lazy(() => import('./pages/testing/CheckoutFlowTests'));

// Lazy load special pages
const SonicGauntlet = lazy(() => import('./pages/SonicGauntlet'));

import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { DemoProtectedRoute } from '@/components/routing/DemoProtectedRoute';
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { Toaster as Sonner } from '@/components/common/shadcn/sonner';
import { TooltipProvider } from '@/components/common/shadcn/tooltip';
import Merch from './pages/Merch';

import { AuthProvider } from '@/features/auth/services/AuthContext';
import { useFeatureFlagHelpers } from '@/shared';
import { FmToolbar } from '@/components/common/toolbar/FmToolbar';
import { FmMobileDevToolbar } from '@/components/common/toolbar/mobile/FmMobileDevToolbar';
import { FmMockRoleExitButton } from '@/components/common/buttons/FmMockRoleExitButton';
import { ROLES } from '@/shared';
import { FEATURE_FLAGS } from '@/shared';
import { CheckoutProvider } from '@/contexts/CheckoutContext';
import { ShoppingCartProvider } from '@/shared';
import { MockRoleProvider } from '@/shared/contexts/MockRoleContext';
import { FmToolbarProvider } from '@/shared/contexts/FmToolbarContext';
import {
  GlobalSearchProvider,
  useGlobalSearch,
} from '@/contexts/GlobalSearchContext';
import { GlobalResourceSearch } from '@/components/admin/GlobalResourceSearch';
import { StripeProvider } from '@/features/payments';

import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import ProxyToken from './pages/ProxyToken';
import Scavenger from './pages/Scavenger';
import ArtistSignup from './pages/artists/ArtistSignup';
import ArtistRegister from './pages/artists/ArtistRegister';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const queryClient = new QueryClient();

// Loading fallback for lazy-loaded components
const LazyLoadFallback = () => (
  <div className='min-h-screen flex items-center justify-center bg-background'>
    <div className='animate-spin rounded-full h-8 w-8 border-[3px] border-fm-gold border-b-transparent' />
  </div>
);

const GlobalSearchWrapper = () => {
  const { isOpen, closeSearch } = useGlobalSearch();
  return <GlobalResourceSearch isOpen={isOpen} onClose={closeSearch} />;
};

const AppRoutes = () => {
  const { isFeatureEnabled, isLoading } = useFeatureFlagHelpers();

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <div className='animate-spin rounded-full h-8 w-8 border-[3px] border-fm-gold border-b-transparent' />
      </div>
    );
  }

  const comingSoonMode = isFeatureEnabled(FEATURE_FLAGS.COMING_SOON_MODE);

  return (
    <Routes>
      {/* Always-accessible routes - highest priority */}
      <Route path='/auth' element={<Auth />} />
      <Route path='/forgot-password' element={<ForgotPassword />} />
      <Route path='/reset-password' element={<ResetPassword />} />
      <Route path='/scavenger' element={<Scavenger />} />
      <Route path='/proxy-token' element={<ProxyToken />} />
      <Route path='/contact' element={<Contact />} />

      {/* Artist Registration Routes - Always accessible even in coming soon mode */}
      <Route path='/artists/signup' element={<ArtistSignup />} />
      <Route
        path='/artists/register'
        element={
          <ProtectedRoute>
            <ArtistRegister />
          </ProtectedRoute>
        }
      />

      {/* Profile Routes - Always accessible for logged in users, even in coming soon mode */}
      <Route
        path='/profile'
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path='/profile/edit'
        element={
          <ProtectedRoute>
            <ProfileEdit />
          </ProtectedRoute>
        }
      />

      {/* ==================== ADMIN/DEVELOPER ROUTES ==================== */}
      {/* These routes are ALWAYS accessible regardless of coming_soon_mode */}
      {/* They are protected by role-based access control instead */}

      {/* Developer Routes - Protected by developer/admin roles */}
      <Route
        path='/developer'
        element={
          <DemoProtectedRoute>
            <Suspense fallback={<LazyLoadFallback />}>
              <DeveloperIndex />
            </Suspense>
          </DemoProtectedRoute>
        }
      />
      <Route
        path='/developer/database'
        element={
          <DemoProtectedRoute>
            <Suspense fallback={<LazyLoadFallback />}>
              <DeveloperDatabase />
            </Suspense>
          </DemoProtectedRoute>
        }
      />
      <Route
        path='/developer/documentation'
        element={
          <DemoProtectedRoute>
            <Suspense fallback={<LazyLoadFallback />}>
              <DeveloperDocumentation />
            </Suspense>
          </DemoProtectedRoute>
        }
      />
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

      {/* Demo Routes - Protected by developer/admin roles */}
      <Route
        path='/developer/demo'
        element={
          <DemoProtectedRoute>
            <Suspense fallback={<LazyLoadFallback />}>
              <DemoIndex />
            </Suspense>
          </DemoProtectedRoute>
        }
      />
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

      {/* Testing Routes - Protected by developer/admin roles */}
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

      {/* Admin Routes - Protected by admin role only */}
      <Route
        path='/admin/statistics'
        element={
          <ProtectedRoute role={ROLES.ADMIN}>
            <Suspense fallback={<LazyLoadFallback />}>
              <Statistics />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/controls'
        element={
          <ProtectedRoute role={ROLES.ADMIN}>
            <Suspense fallback={<LazyLoadFallback />}>
              <AdminControls />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/organizations/:id'
        element={
          <ProtectedRoute role={ROLES.ADMIN}>
            <Suspense fallback={<LazyLoadFallback />}>
              <OrganizationDetails />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/users/:id'
        element={
          <ProtectedRoute role={ROLES.ADMIN}>
            <Suspense fallback={<LazyLoadFallback />}>
              <UserDetails />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/logs'
        element={
          <ProtectedRoute role={ROLES.ADMIN}>
            <Suspense fallback={<LazyLoadFallback />}>
              <ActivityLogs />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/galleries/:slug'
        element={
          <ProtectedRoute role={[ROLES.ADMIN, ROLES.DEVELOPER]}>
            <Suspense fallback={<LazyLoadFallback />}>
              <GalleryManagement />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Create Routes - Protected by admin/developer roles */}
      <Route
        path='/events/create'
        element={
          <ProtectedRoute role={[ROLES.ADMIN, ROLES.DEVELOPER]}>
            <Suspense fallback={<LazyLoadFallback />}>
              <DeveloperCreateEventPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path='/artists/create'
        element={
          <ProtectedRoute role={[ROLES.ADMIN, ROLES.DEVELOPER]}>
            <Suspense fallback={<LazyLoadFallback />}>
              <DeveloperCreateArtistPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path='/venues/create'
        element={
          <ProtectedRoute role={[ROLES.ADMIN, ROLES.DEVELOPER]}>
            <Suspense fallback={<LazyLoadFallback />}>
              <DeveloperCreateVenuePage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path='/organizations/create'
        element={
          <ProtectedRoute role={[ROLES.ADMIN, ROLES.DEVELOPER]}>
            <Suspense fallback={<LazyLoadFallback />}>
              <DeveloperCreateOrganizationPage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Venue Management Routes - Protected by admin/developer roles */}
      <Route
        path='/venues/:id/manage'
        element={
          <ProtectedRoute role={[ROLES.ADMIN, ROLES.DEVELOPER]}>
            <Suspense fallback={<LazyLoadFallback />}>
              <VenueManagement />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Artist Management Routes - Protected by admin/developer roles */}
      <Route
        path='/artists/:id/manage'
        element={
          <ProtectedRoute role={[ROLES.ADMIN, ROLES.DEVELOPER]}>
            <Suspense fallback={<LazyLoadFallback />}>
              <ArtistManagement />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* ==================== END ADMIN/DEVELOPER ROUTES ==================== */}

      {/* Coming Soon Mode - Show only coming soon page for public routes */}
      {comingSoonMode ? (
        <>
          <Route path='/' element={<ComingSoon />} />
        </>
      ) : (
        <>
          {/* Normal App Routes - Only accessible when NOT in coming soon mode */}
          <Route path='/' element={<Index />} />
          <Route path='/event/:id' element={<EventDetails />} />
          <Route path='/event/:id/tickets' element={<EventTicketing />} />
          <Route path='/event/:id/manage' element={<EventManagement />} />

          {/* Venue Routes (public) */}
          <Route
            path='/venues/:id'
            element={
              <Suspense fallback={<LazyLoadFallback />}>
                <VenueDetails />
              </Suspense>
            }
          />

          {/* Artist Routes (public) */}
          <Route
            path='/artists/:id'
            element={
              <Suspense fallback={<LazyLoadFallback />}>
                <ArtistDetails />
              </Suspense>
            }
          />

          {/* Conditionally render merch route based on feature flag */}
          {isFeatureEnabled(FEATURE_FLAGS.MERCH_STORE) && (
            <Route path='/merch' element={<Merch />} />
          )}

          {/* Conditionally render member profiles route based on feature flag */}
          {isFeatureEnabled(FEATURE_FLAGS.MEMBER_PROFILES) && (
            <Route path='/members/home' element={<MemberHome />} />
          )}

          {/* Conditionally render Sonic Gauntlet route based on feature flag */}
          {isFeatureEnabled(FEATURE_FLAGS.SONIC_GAUNTLET) && (
            <Route
              path='/sonic-gauntlet'
              element={
                <Suspense fallback={<LazyLoadFallback />}>
                  <SonicGauntlet />
                </Suspense>
              }
            />
          )}

          {/* Profile routes are now defined above, outside coming soon mode */}
          <Route path='/orders' element={<Orders />} />

          {/* Checkout Routes */}
          <Route path='/checkout/success' element={<CheckoutSuccess />} />
          <Route path='/checkout/cancel' element={<CheckoutCancel />} />

          {/* Organization Routes */}
          <Route path='/organization/tools' element={<OrganizationTools />} />
          <Route path='/organization/scanning' element={<TicketScanning />} />

          {/* Artist Routes - signup and register are above, outside coming soon mode */}
          <Route path='/artists' element={<Navigate to='/' replace />} />
        </>
      )}

      {/* Catch-all route - must be last */}
      <Route path='*' element={comingSoonMode ? <Navigate to='/' replace /> : <NotFound />} />
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
          <MockRoleProvider>
            <FmToolbarProvider>
              <StripeProvider>
                <ShoppingCartProvider>
                  <GlobalSearchProvider>
                    <TooltipProvider>
                      <Sonner />
                      <BrowserRouter>
                        <CheckoutProvider>
                          <Suspense fallback={<LazyLoadFallback />}>
                            <AppRoutes />
                          </Suspense>
                          <FmToolbar />
                          <FmMobileDevToolbar />
                          <FmMockRoleExitButton />
                          <GlobalSearchWrapper />
                        </CheckoutProvider>
                      </BrowserRouter>
                    </TooltipProvider>
                  </GlobalSearchProvider>
                </ShoppingCartProvider>
              </StripeProvider>
            </FmToolbarProvider>
          </MockRoleProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
