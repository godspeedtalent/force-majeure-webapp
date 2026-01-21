import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import Auth from './pages/Auth';
import CheckoutCancel from './pages/CheckoutCancel';
import CheckoutSuccess from './pages/CheckoutSuccess';
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
// DemoIndex is now embedded as a tab in DeveloperHome
const EventCheckout = lazy(() => import('./pages/demo/EventCheckout'));
const EventCheckoutConfirmation = lazy(() => import('./pages/demo/EventCheckoutConfirmation'));
const EmailTemplateDemo = lazy(() => import('./pages/demo/EmailTemplateDemo'));
const StoryDesigner = lazy(() => import('./pages/demo/StoryDesigner'));

// Lazy load developer pages
const DeveloperHome = lazy(() => import('./pages/developer/DeveloperHome'));
// DeveloperDocumentation is now embedded as a tab in DeveloperHome
const TicketFlowTests = lazy(() => import('./pages/developer/TicketFlowTests'));
const DeveloperCreateEventPage = lazy(() => import('./pages/developer/database/CreateEvent'));
const DeveloperCreateArtistPage = lazy(() => import('./pages/developer/database/CreateArtist'));
const DeveloperCreateVenuePage = lazy(() => import('./pages/developer/database/CreateVenue'));
const DeveloperCreateOrganizationPage = lazy(() => import('./pages/developer/database/CreateOrganization'));
const ArtistSignupDemo = lazy(() => import('./pages/developer/ArtistSignupDemo'));

// Lazy load admin pages
const Statistics = lazy(() => import('./pages/admin/Statistics'));
// ActivityLogs moved to inline DeveloperHome - keeping redirect for backwards compatibility
const OrganizationDetails = lazy(() => import('./pages/admin/OrganizationDetails'));
const UserDetails = lazy(() => import('./pages/admin/UserDetails'));
const GalleryManagement = lazy(() => import('./pages/admin/GalleryManagement'));
const ProductsManagement = lazy(() => import('./pages/admin/ProductsManagement'));
// AnalyticsDashboard moved to inline DeveloperHome - keeping redirect for backwards compatibility

// Lazy load venue and artist pages
const VenueDetails = lazy(() => import('./pages/venues/VenueDetails'));
const VenueManagement = lazy(() => import('./pages/venues/VenueManagement'));
const ArtistDetails = lazy(() => import('./pages/artists/ArtistDetails'));
const ArtistManagement = lazy(() => import('./pages/artists/ArtistManagement'));
const OrganizationManagement = lazy(() => import('./pages/organization/OrganizationManagement'));
const RecordingDetails = lazy(() => import('./pages/recordings/RecordingDetails'));

// Lazy load user pages
const PublicUserProfile = lazy(() => import('./pages/users/PublicUserProfile'));
const UserProfileEdit = lazy(() => import('./pages/users/UserProfileEdit'));

// Lazy load testing pages
const TestingIndex = lazy(() => import('./pages/testing/TestingIndex'));
const CheckoutFlowTests = lazy(() => import('./pages/testing/CheckoutFlowTests'));

// Lazy load special pages
const SonicGauntlet = lazy(() => import('./pages/SonicGauntlet'));
const ClaimTicketPage = lazy(() => import('./pages/claim-ticket/ClaimTicketPage'));
const TrackingLinkRedirect = lazy(() => import('./pages/tracking/TrackingLinkRedirect'));

// Lazy load wallet pages
const Wallet = lazy(() => import('./pages/wallet/Wallet'));
const TicketView = lazy(() => import('./pages/wallet/TicketView'));
const OrderTickets = lazy(() => import('./pages/orders/OrderTickets'));

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
import { NavigationProvider } from '@/contexts/NavigationContext';
import { ShoppingCartProvider } from '@/shared';
import { MockRoleProvider } from '@/shared/contexts/MockRoleContext';
import { FmToolbarProvider } from '@/shared/contexts/FmToolbarContext';
import {
  GlobalSearchProvider,
  useGlobalSearch,
} from '@/contexts/GlobalSearchContext';
import { GlobalResourceSearch } from '@/components/admin/GlobalResourceSearch';
import { StripeProvider } from '@/features/payments';
import { AnalyticsProvider } from '@/features/analytics';

import NotFound from './pages/NotFound';
import ProxyToken from './pages/ProxyToken';
import { ProfileRedirect, ProfileEditRedirect } from './pages/users/ProfileRedirects';
import Scavenger from './pages/Scavenger';
import ArtistSignup from './pages/artists/ArtistSignup';
import ArtistRegister from './pages/artists/ArtistRegister';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const queryClient = new QueryClient();

// Loading fallback for lazy-loaded components
const LazyLoadFallback = () => (
  <div className='min-h-screen flex items-center justify-center bg-background'>
    <FmCommonLoadingSpinner size='lg' />
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
        <FmCommonLoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <Routes>
      {/* Always-accessible routes - highest priority */}
      <Route path='/auth' element={<Auth />} />
      <Route path='/forgot-password' element={<ForgotPassword />} />
      <Route path='/reset-password' element={<ResetPassword />} />
      <Route path='/scavenger' element={<Scavenger />} />
      <Route path='/proxy-token' element={<ProxyToken />} />
      <Route path='/contact' element={<Contact />} />

      {/* Tracking Link Redirect - Public route for short tracking URLs */}
      <Route
        path='/t/:code'
        element={
          <Suspense fallback={<LazyLoadFallback />}>
            <TrackingLinkRedirect />
          </Suspense>
        }
      />

      {/* Artist Registration Routes - Always accessible */}
      <Route path='/artists/signup' element={<ArtistSignup />} />
      <Route
        path='/artists/register'
        element={
          <ProtectedRoute>
            <ArtistRegister />
          </ProtectedRoute>
        }
      />

      {/* Profile Routes - Redirect to unified /users/:id routes */}
      <Route
        path='/profile'
        element={
          <ProtectedRoute>
            <ProfileRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path='/profile/edit'
        element={
          <ProtectedRoute>
            <ProfileEditRedirect />
          </ProtectedRoute>
        }
      />

      {/* ==================== ADMIN/DEVELOPER ROUTES ==================== */}
      {/* These routes are protected by role-based access control */}

      {/* Developer Routes - Protected by developer/admin roles */}
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
      {/* Redirect old database route to unified developer home */}
      <Route
        path='/developer/database'
        element={<Navigate to='/developer?tab=db_overview' replace />}
      />
      {/* Redirect old documentation route to unified developer home tab */}
      <Route
        path='/developer/documentation'
        element={<Navigate to='/developer?tab=dev_docs' replace />}
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
      {/* Redirect old dashboards route to unified developer home */}
      <Route
        path='/developer/dashboards'
        element={<Navigate to='/developer?tab=dash_recordings' replace />}
      />
      {/* Redirect old recording analytics route */}
      <Route
        path='/developer/recording-analytics'
        element={<Navigate to='/developer?tab=dash_recordings' replace />}
      />

      {/* Redirect old demo index route to unified developer home tab */}
      <Route
        path='/developer/demo'
        element={<Navigate to='/developer?tab=dev_demo' replace />}
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
      {/* Redirect old admin controls route to unified developer home */}
      <Route
        path='/admin/controls'
        element={<Navigate to='/developer?tab=admin_settings' replace />}
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
      {/* Redirect old activity logs route to unified developer home */}
      <Route
        path='/admin/logs'
        element={<Navigate to='/developer?tab=logs_all' replace />}
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
      <Route
        path='/admin/products'
        element={
          <ProtectedRoute role={[ROLES.ADMIN, ROLES.DEVELOPER]}>
            <Suspense fallback={<LazyLoadFallback />}>
              <ProductsManagement />
            </Suspense>
          </ProtectedRoute>
        }
      />
      {/* Redirect old analytics route to unified developer home */}
      <Route
        path='/admin/analytics'
        element={<Navigate to='/developer?tab=dash_analytics' replace />}
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

      {/* Organization Management Routes - Protected by admin/developer roles */}
      <Route
        path='/organizations/:id/manage'
        element={
          <ProtectedRoute role={[ROLES.ADMIN, ROLES.DEVELOPER]}>
            <Suspense fallback={<LazyLoadFallback />}>
              <OrganizationManagement />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* ==================== END ADMIN/DEVELOPER ROUTES ==================== */}

      {/* Public App Routes */}
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

      {/* Recording Routes (public) */}
      <Route
        path='/recordings/:id'
        element={
          <Suspense fallback={<LazyLoadFallback />}>
            <RecordingDetails />
          </Suspense>
        }
      />

      {/* User Profile Routes (feature flag controlled with admin bypass) */}
      <Route
        path='/users/:id'
        element={
          <Suspense fallback={<LazyLoadFallback />}>
            <PublicUserProfile />
          </Suspense>
        }
      />
      <Route
        path='/users/:id/edit'
        element={
          <ProtectedRoute>
            <Suspense fallback={<LazyLoadFallback />}>
              <UserProfileEdit />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Conditionally render merch route based on feature flag */}
      {isFeatureEnabled(FEATURE_FLAGS.MERCH_STORE) && (
        <Route path='/merch' element={<Merch />} />
      )}

      {/* Member home route - always available */}
      <Route path='/members/home' element={<MemberHome />} />

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

      <Route path='/orders' element={<Orders />} />
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

      {/* Wallet Routes */}
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

      {/* Checkout Routes */}
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

      {/* Organization Routes - gated by feature flag */}
      {isFeatureEnabled(FEATURE_FLAGS.ORGANIZATION_TOOLS) && (
        <>
          <Route path='/organization/tools' element={<OrganizationTools />} />
          <Route path='/organization/scanning' element={<TicketScanning />} />
        </>
      )}

      {/* Artist Routes - signup and register are defined above */}
      <Route path='/artists' element={<Navigate to='/' replace />} />

      {/* Catch-all route - must be last */}
      <Route path='*' element={<NotFound />} />
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
                        <NavigationProvider>
                          <AnalyticsProvider>
                            <CheckoutProvider>
                            <Suspense fallback={<LazyLoadFallback />}>
                              <AppRoutes />
                            </Suspense>
                            <FmToolbar />
                            <FmMobileDevToolbar />
                            <FmMockRoleExitButton />
                            <GlobalSearchWrapper />
                            </CheckoutProvider>
                          </AnalyticsProvider>
                        </NavigationProvider>
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
