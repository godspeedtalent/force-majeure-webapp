import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserRole } from '@/shared/hooks/useUserRole';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';
import { LoadingState } from '@/components/common/LoadingState';

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
  const { user, loading: authLoading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { data: flags, isLoading: flagsLoading } = useFeatureFlags();
  const [canAccess, setCanAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = () => {
      if (authLoading || roleLoading || flagsLoading) {
        return;
      }

      // Check if user is authenticated
      if (!user) {
        setCanAccess(false);
        return;
      }

      // Check if demo_pages flag is enabled
      if (!flags?.demo_pages) {
        setCanAccess(false);
        return;
      }

      // Check if user has developer or admin role
      // Note: 'developer' role exists in DB but types haven't regenerated yet
      const roleAsString = userRole as string | null;
      const hasAccess = roleAsString === 'developer' || roleAsString === 'admin';
      setCanAccess(hasAccess);
    };

    checkAccess();
  }, [user, userRole, flags, authLoading, roleLoading, flagsLoading]);

  // Still loading
  if (authLoading || roleLoading || flagsLoading || canAccess === null) {
    return <LoadingState />;
  }

  // Access denied
  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  // Access granted
  return <>{children}</>;
};
