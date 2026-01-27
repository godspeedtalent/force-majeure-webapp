import { Suspense } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { LazyLoadFallback } from '@/components/app';
import { ROLES } from '@/shared';
import {
  Statistics,
  OrganizationDetails,
  UserDetails,
  GalleryManagement,
  ProductsManagement,
  DeveloperCreateEventPage,
  DeveloperCreateArtistPage,
  DeveloperCreateVenuePage,
  DeveloperCreateOrganizationPage,
  VenueManagement,
  OrganizationManagement,
  ArtistManagement,
} from './lazyComponents';
import ArtistRegister from '@/pages/artists/ArtistRegister';

/**
 * Admin routes protected by admin role or admin/developer roles.
 * Includes statistics, user/org details, and create/management pages.
 */
export const adminRoutes = (
  <>
    {/* Admin statistics */}
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

    {/* Redirects for old admin routes */}
    <Route path='/admin/controls' element={<Navigate to='/developer?tab=admin_settings' replace />} />
    <Route path='/admin/logs' element={<Navigate to='/developer?tab=logs_all' replace />} />
    <Route path='/admin/analytics' element={<Navigate to='/developer?tab=dash_analytics' replace />} />

    {/* Organization details */}
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

    {/* User details */}
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

    {/* Gallery management */}
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

    {/* Products management */}
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

    {/* Create routes */}
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

    {/* Management routes */}
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

    {/* Artist management - protected by authentication, ownership checked in component */}
    <Route
      path='/artists/:id/manage'
      element={
        <ProtectedRoute>
          <Suspense fallback={<LazyLoadFallback />}>
            <ArtistManagement />
          </Suspense>
        </ProtectedRoute>
      }
    />

    {/* Artist registration - requires auth */}
    <Route
      path='/artists/register'
      element={
        <ProtectedRoute>
          <ArtistRegister />
        </ProtectedRoute>
      }
    />
  </>
);
