import { Suspense } from 'react';
import { Route } from 'react-router-dom';
import { useFeatureFlagHelpers, FEATURE_FLAGS } from '@/shared';
import { LazyLoadFallback } from '@/components/app';
import { SonicGauntlet } from './lazyComponents';
import Merch from '@/pages/Merch';

/**
 * Feature flag controlled routes.
 * These routes are conditionally rendered based on feature flag state.
 */
export const FeatureFlagRoutes = () => {
  const { isFeatureEnabled } = useFeatureFlagHelpers();

  return (
    <>
      {/* Merch store - controlled by MERCH_STORE flag */}
      {isFeatureEnabled(FEATURE_FLAGS.MERCH_STORE) && <Route path='/merch' element={<Merch />} />}

      {/* Sonic Gauntlet - controlled by SONIC_GAUNTLET flag */}
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
    </>
  );
};
