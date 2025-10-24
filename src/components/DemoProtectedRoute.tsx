import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';
import { LoadingState } from '@/components/common/LoadingState';
import { useDevRole } from '@/shared/hooks/useDevRole';

interface DemoProtectedRouteProps {
  children: ReactNode;
}

/**
 * Protects demo routes by requiring:
 * 1. User to be authenticated
 * 2. demo_pages feature flag to be enabled
 * 3. User to have either 'developer' or 'admin' role
 */
export const DemoProtectedRoute = ({ children }: DemoProtectedRouteProps) => {
  const { role, isAuthenticated, isLoading: roleLoading } = useDevRole();
  const { data: flags, isLoading: flagsLoading } = useFeatureFlags();
  const [canAccess, setCanAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = () => {
      if (roleLoading || flagsLoading) {
        return;
      }

      // Check if user is authenticated
      if (!isAuthenticated) {
        setCanAccess(false);
        return;
      }

      // Check if demo_pages flag is enabled
      if (!flags?.demo_pages) {
        setCanAccess(false);
        return;
      }

      // Check if user has developer or admin role
      const hasAccess = role === 'developer' || role === 'admin';
      setCanAccess(hasAccess);
    };

    checkAccess();
  }, [isAuthenticated, role, flags, roleLoading, flagsLoading]);

  // Still loading
  if (roleLoading || flagsLoading || canAccess === null) {
    return <LoadingState />;
  }

  // Access denied
  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  // Access granted
  return <>{children}</>;
};
