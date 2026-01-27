import { Suspense } from 'react';
import { Routes, useLocation } from 'react-router-dom';
import { useFeatureFlagHelpers } from '@/shared';
import { diagInfo } from '@/shared/services/initDiagnostics';
import { LazyLoadFallback } from '@/components/app';
import { FmGoldenGridLoader } from '@/components/common/feedback/FmGoldenGridLoader';

// Import all route groups
import {
  publicRoutes,
  eventRoutes,
  developerRoutes,
  staffRoutes,
  adminRoutes,
  entityRoutes,
  walletRoutes,
  checkoutRoutes,
  organizationRoutes,
  FeatureFlagRoutes,
} from '@/routes';

/**
 * Main route orchestrator that composes all route groups.
 * Handles feature flag loading states for flagged routes.
 */
export const AppRoutes = () => {
  diagInfo('routes.rendering');
  const { isLoading } = useFeatureFlagHelpers();
  const location = useLocation();
  diagInfo('routes.featureFlags', { loading: isLoading, path: location.pathname });

  // Routes that depend on feature flags
  const isFlaggedRoute =
    location.pathname.startsWith('/merch') || location.pathname.startsWith('/sonic-gauntlet');

  // Only block on feature flags when the current route depends on them.
  // This avoids a global startup stall if the flags request hangs.
  if (isLoading && isFlaggedRoute) {
    diagInfo('routes.waitingForFlags', { path: location.pathname });
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <FmGoldenGridLoader size='lg' />
      </div>
    );
  }

  return (
    <Suspense fallback={<LazyLoadFallback />}>
      <Routes>
        {/* Public routes - auth, contact, home, etc. */}
        {publicRoutes}

        {/* Event routes */}
        {eventRoutes}

        {/* Developer routes - /developer/*, demos, testing */}
        {developerRoutes}

        {/* Staff routes - /staff/* */}
        {staffRoutes}

        {/* Admin routes - /admin/*, create pages, management */}
        {adminRoutes}

        {/* Entity routes - venues, artists, recordings, users */}
        {entityRoutes}

        {/* Wallet & order routes */}
        {walletRoutes}

        {/* Checkout routes */}
        {checkoutRoutes}

        {/* Organization routes */}
        {organizationRoutes}

        {/* Feature flag controlled routes */}
        <FeatureFlagRoutes />
      </Routes>
    </Suspense>
  );
};
