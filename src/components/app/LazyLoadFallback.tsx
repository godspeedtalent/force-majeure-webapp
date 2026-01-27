import { useEffect } from 'react';
import { diagInfo } from '@/shared/services/initDiagnostics';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';

/**
 * Loading fallback component for lazy-loaded routes.
 * Displays a centered loading spinner and logs diagnostics for tracking.
 */
export const LazyLoadFallback = () => {
  useEffect(() => {
    diagInfo('suspense.fallback.shown');
    return () => {
      diagInfo('suspense.fallback.resolved');
    };
  }, []);

  return (
    <div className='min-h-screen flex items-center justify-center bg-background'>
      <FmCommonLoadingState centered={false} size='lg' />
    </div>
  );
};
