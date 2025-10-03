import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Loader2 } from 'lucide-react';

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
  invert = false 
}: FeatureFlagGuardProps) => {
  const { data: flags, isLoading } = useFeatureFlags();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-fm-gold" />
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
