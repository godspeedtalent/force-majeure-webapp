import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
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
// Lazy load admin pages
const Statistics = lazy(() => import('./pages/admin/Statistics'));
const AdminControls = lazy(() => import('./pages/admin/AdminControls'));
const ActivityLogs = lazy(() => import('./pages/admin/ActivityLogs'));
const OrganizationDetails = lazy(() => import('./pages/admin/OrganizationDetails'));
const UserDetails = lazy(() => import('./pages/admin/UserDetails'));
// Lazy load venue and artist pages
const VenueDetails = lazy(() => import('./pages/venues/VenueDetails'));
const VenueManagement = lazy(() => import('./pages/venues/VenueManagement'));
const ArtistDetails = lazy(() => import('./pages/artists/ArtistDetails'));
const ArtistManagement = lazy(() => import('./pages/artists/ArtistManagement'));
// Lazy load testing pages
const TestingIndex = lazy(() => import('./pages/testing/TestingIndex'));
const CheckoutFlowTests = lazy(() => import('./pages/testing/CheckoutFlowTests'));
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
import { ROLES } from '@/shared';
import { FEATURE_FLAGS } from '@/shared';
import { CheckoutProvider } from '@/contexts/CheckoutContext';
import { ShoppingCartProvider } from '@/shared';
import { MockRoleProvider } from '@/shared/contexts/MockRoleContext';
import { GlobalSearchProvider, useGlobalSearch, } from '@/contexts/GlobalSearchContext';
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
const LazyLoadFallback = () => (_jsx("div", { className: 'min-h-screen flex items-center justify-center bg-background', children: _jsx("div", { className: 'animate-spin rounded-full h-8 w-8 border-[3px] border-fm-gold border-b-transparent' }) }));
const GlobalSearchWrapper = () => {
    const { isOpen, closeSearch } = useGlobalSearch();
    return _jsx(GlobalResourceSearch, { isOpen: isOpen, onClose: closeSearch });
};
const AppRoutes = () => {
    const { isFeatureEnabled, isLoading } = useFeatureFlagHelpers();
    if (isLoading) {
        return (_jsx("div", { className: 'min-h-screen flex items-center justify-center bg-background', children: _jsx("div", { className: 'animate-spin rounded-full h-8 w-8 border-[3px] border-fm-gold border-b-transparent' }) }));
    }
    const comingSoonMode = isFeatureEnabled(FEATURE_FLAGS.COMING_SOON_MODE);
    return (_jsxs(Routes, { children: [_jsx(Route, { path: '/auth', element: _jsx(Auth, {}) }), _jsx(Route, { path: '/forgot-password', element: _jsx(ForgotPassword, {}) }), _jsx(Route, { path: '/reset-password', element: _jsx(ResetPassword, {}) }), _jsx(Route, { path: '/scavenger', element: _jsx(Scavenger, {}) }), _jsx(Route, { path: '/proxy-token', element: _jsx(ProxyToken, {}) }), _jsx(Route, { path: '/artists/signup', element: _jsx(ArtistSignup, {}) }), _jsx(Route, { path: '/artists/register', element: _jsx(ProtectedRoute, { children: _jsx(ArtistRegister, {}) }) }), _jsx(Route, { path: '/profile', element: _jsx(ProtectedRoute, { children: _jsx(Profile, {}) }) }), _jsx(Route, { path: '/profile/edit', element: _jsx(ProtectedRoute, { children: _jsx(ProfileEdit, {}) }) }), _jsx(Route, { path: '/developer', element: _jsx(DemoProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(DeveloperIndex, {}) }) }) }), _jsx(Route, { path: '/developer/database', element: _jsx(DemoProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(DeveloperDatabase, {}) }) }) }), _jsx(Route, { path: '/developer/documentation', element: _jsx(DemoProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(DeveloperDocumentation, {}) }) }) }), _jsx(Route, { path: '/developer/ticket-flow', element: _jsx(DemoProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(TicketFlowTests, {}) }) }) }), _jsx(Route, { path: '/developer/demo', element: _jsx(DemoProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(DemoIndex, {}) }) }) }), _jsx(Route, { path: '/developer/demo/event-checkout', element: _jsx(DemoProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(EventCheckout, {}) }) }) }), _jsx(Route, { path: '/developer/demo/event-checkout-confirmation', element: _jsx(DemoProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(EventCheckoutConfirmation, {}) }) }) }), _jsx(Route, { path: '/developer/demo/email-template', element: _jsx(DemoProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(EmailTemplateDemo, {}) }) }) }), _jsx(Route, { path: '/testing', element: _jsx(DemoProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(TestingIndex, {}) }) }) }), _jsx(Route, { path: '/testing/checkout-flow', element: _jsx(DemoProtectedRoute, { children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(CheckoutFlowTests, {}) }) }) }), _jsx(Route, { path: '/admin/statistics', element: _jsx(ProtectedRoute, { role: ROLES.ADMIN, children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(Statistics, {}) }) }) }), _jsx(Route, { path: '/admin/controls', element: _jsx(ProtectedRoute, { role: ROLES.ADMIN, children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(AdminControls, {}) }) }) }), _jsx(Route, { path: '/admin/organizations/:id', element: _jsx(ProtectedRoute, { role: ROLES.ADMIN, children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(OrganizationDetails, {}) }) }) }), _jsx(Route, { path: '/admin/users/:id', element: _jsx(ProtectedRoute, { role: ROLES.ADMIN, children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(UserDetails, {}) }) }) }), _jsx(Route, { path: '/admin/logs', element: _jsx(ProtectedRoute, { role: ROLES.ADMIN, children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(ActivityLogs, {}) }) }) }), _jsx(Route, { path: '/events/create', element: _jsx(ProtectedRoute, { role: [ROLES.ADMIN, ROLES.DEVELOPER], children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(DeveloperCreateEventPage, {}) }) }) }), _jsx(Route, { path: '/artists/create', element: _jsx(ProtectedRoute, { role: [ROLES.ADMIN, ROLES.DEVELOPER], children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(DeveloperCreateArtistPage, {}) }) }) }), _jsx(Route, { path: '/venues/create', element: _jsx(ProtectedRoute, { role: [ROLES.ADMIN, ROLES.DEVELOPER], children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(DeveloperCreateVenuePage, {}) }) }) }), _jsx(Route, { path: '/organizations/create', element: _jsx(ProtectedRoute, { role: [ROLES.ADMIN, ROLES.DEVELOPER], children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(DeveloperCreateOrganizationPage, {}) }) }) }), _jsx(Route, { path: '/venues/:id/manage', element: _jsx(ProtectedRoute, { role: [ROLES.ADMIN, ROLES.DEVELOPER], children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(VenueManagement, {}) }) }) }), _jsx(Route, { path: '/artists/:id/manage', element: _jsx(ProtectedRoute, { role: [ROLES.ADMIN, ROLES.DEVELOPER], children: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(ArtistManagement, {}) }) }) }), comingSoonMode ? (_jsx(_Fragment, { children: _jsx(Route, { path: '/', element: _jsx(ComingSoon, {}) }) })) : (_jsxs(_Fragment, { children: [_jsx(Route, { path: '/', element: _jsx(Index, {}) }), _jsx(Route, { path: '/event/:id', element: _jsx(EventDetails, {}) }), _jsx(Route, { path: '/event/:id/tickets', element: _jsx(EventTicketing, {}) }), _jsx(Route, { path: '/event/:id/manage', element: _jsx(EventManagement, {}) }), _jsx(Route, { path: '/venues/:id', element: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(VenueDetails, {}) }) }), _jsx(Route, { path: '/artists/:id', element: _jsx(Suspense, { fallback: _jsx(LazyLoadFallback, {}), children: _jsx(ArtistDetails, {}) }) }), isFeatureEnabled(FEATURE_FLAGS.MERCH_STORE) && (_jsx(Route, { path: '/merch', element: _jsx(Merch, {}) })), isFeatureEnabled(FEATURE_FLAGS.MEMBER_PROFILES) && (_jsx(Route, { path: '/members/home', element: _jsx(MemberHome, {}) })), _jsx(Route, { path: '/orders', element: _jsx(Orders, {}) }), _jsx(Route, { path: '/contact', element: _jsx(Contact, {}) }), _jsx(Route, { path: '/checkout/success', element: _jsx(CheckoutSuccess, {}) }), _jsx(Route, { path: '/checkout/cancel', element: _jsx(CheckoutCancel, {}) }), _jsx(Route, { path: '/organization/tools', element: _jsx(OrganizationTools, {}) }), _jsx(Route, { path: '/organization/scanning', element: _jsx(TicketScanning, {}) }), _jsx(Route, { path: '/artists', element: _jsx(Navigate, { to: '/', replace: true }) })] })), _jsx(Route, { path: '*', element: comingSoonMode ? _jsx(Navigate, { to: '/', replace: true }) : _jsx(NotFound, {}) })] }));
};
const App = () => {
    // Force dark mode by adding class to html element
    if (typeof document !== 'undefined') {
        document.documentElement.classList.add('dark');
    }
    return (_jsx(ErrorBoundary, { children: _jsx(QueryClientProvider, { client: queryClient, children: _jsx(AuthProvider, { children: _jsx(MockRoleProvider, { children: _jsx(StripeProvider, { children: _jsx(ShoppingCartProvider, { children: _jsx(GlobalSearchProvider, { children: _jsxs(TooltipProvider, { children: [_jsx(Sonner, {}), _jsx(BrowserRouter, { children: _jsxs(CheckoutProvider, { children: [_jsx(AppRoutes, {}), _jsx(FmToolbar, {}), _jsx(FmMobileDevToolbar, {}), _jsx(GlobalSearchWrapper, {})] }) })] }) }) }) }) }) }) }) }));
};
export default App;
