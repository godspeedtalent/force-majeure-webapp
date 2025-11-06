/**
 * @deprecated Use FeatureGuard from '@/components/common/guards/FeatureGuard' instead.
 * 
 * This component is deprecated and maintained only for backwards compatibility.
 * The new FeatureGuard provides better type safety with FEATURE_FLAGS constants.
 * 
 * Migration example:
 * Old: <FeatureFlagGuard flagName="scavenger_hunt_active" redirectTo="/">
 * New: <FeatureGuard feature={FEATURE_FLAGS.SCAVENGER_HUNT_ACTIVE} fallback={<Navigate to="/" replace />}>
 */

import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';

interface FeatureFlagGuardProps {
  children: ReactNode;
  flagName: 'scavenger_hunt_active' | 'show_leaderboard' | 'coming_soon_mode';
  redirectTo?: string;
  invert?: boolean; // If true, show children when flag is false
}

export const FeatureFlagGuard = ({
  children,
  flagName,
  redirectTo = '/',
  invert = false,
}: FeatureFlagGuardProps) => {
  const { data: flags, isLoading } = useFeatureFlags();

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <Loader2 className='w-8 h-8 animate-spin text-fm-gold' />
      </div>
    );
  }

  const flagValue = flags?.[flagName] ?? false;
  const shouldShow = invert ? !flagValue : flagValue;

  if (!shouldShow) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
