import { Suspense } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { LazyLoadFallback } from '@/components/app';
import {
  VenueDetails,
  ArtistDetails,
  RecordingDetails,
  PublicUserProfile,
  UserProfileEdit,
} from './lazyComponents';
import { ProfileRedirect, ProfileEditRedirect } from '@/pages/users/ProfileRedirects';

/**
 * Entity routes for venues, artists, recordings, and user profiles.
 * Mix of public and protected routes.
 */
export const entityRoutes = (
  <>
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

    {/* Artist index redirect */}
    <Route path='/artists' element={<Navigate to='/' replace />} />

    {/* Recording Routes (public) */}
    <Route
      path='/recordings/:id'
      element={
        <Suspense fallback={<LazyLoadFallback />}>
          <RecordingDetails />
        </Suspense>
      }
    />

    {/* User Profile Routes */}
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
  </>
);
