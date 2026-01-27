import { Suspense } from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { LazyLoadFallback } from '@/components/app';
import { ROLES } from '@/shared';
import { StaffHome, ReviewInterface } from './lazyComponents';

/**
 * Staff routes protected by fm_staff or org_staff roles.
 * Includes staff home and screening review interface.
 */
export const staffRoutes = (
  <>
    <Route
      path='/staff'
      element={
        <ProtectedRoute role={[ROLES.FM_STAFF, ROLES.ORG_STAFF]}>
          <Suspense fallback={<LazyLoadFallback />}>
            <StaffHome />
          </Suspense>
        </ProtectedRoute>
      }
    />
    <Route
      path='/staff/screening/review/:id'
      element={
        <ProtectedRoute role={[ROLES.FM_STAFF, ROLES.ORG_STAFF]}>
          <Suspense fallback={<LazyLoadFallback />}>
            <ReviewInterface />
          </Suspense>
        </ProtectedRoute>
      }
    />
  </>
);
