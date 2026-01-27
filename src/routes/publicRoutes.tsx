import { Suspense } from 'react';
import { Route } from 'react-router-dom';
import { LazyLoadFallback } from '@/components/app';
import { TrackingLinkRedirect } from './lazyComponents';

// Non-lazy public pages (critical path)
import Auth from '@/pages/Auth';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Contact from '@/pages/Contact';
import Scavenger from '@/pages/Scavenger';
import ProxyToken from '@/pages/ProxyToken';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import ArtistSignup from '@/pages/artists/ArtistSignup';

/**
 * Public routes that are always accessible without authentication.
 * Includes auth pages, contact, and the home page.
 */
export const publicRoutes = (
  <>
    {/* Authentication routes */}
    <Route path='/auth' element={<Auth />} />
    <Route path='/forgot-password' element={<ForgotPassword />} />
    <Route path='/reset-password' element={<ResetPassword />} />

    {/* Public pages */}
    <Route path='/contact' element={<Contact />} />
    <Route path='/scavenger' element={<Scavenger />} />
    <Route path='/proxy-token' element={<ProxyToken />} />

    {/* Tracking Link Redirect - Public route for short tracking URLs */}
    <Route
      path='/t/:code'
      element={
        <Suspense fallback={<LazyLoadFallback />}>
          <TrackingLinkRedirect />
        </Suspense>
      }
    />

    {/* Artist signup - public landing page */}
    <Route path='/artists/signup' element={<ArtistSignup />} />

    {/* Home page */}
    <Route path='/' element={<Index />} />

    {/* Catch-all route - must be last in main Routes */}
    <Route path='*' element={<NotFound />} />
  </>
);
