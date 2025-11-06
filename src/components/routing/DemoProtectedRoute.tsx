import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { useDevRole } from '@/shared/hooks/useDevRole';
import { ROLES, PERMISSIONS } from '@/shared/auth/permissions';

interface DemoProtectedRouteProps {
  children: ReactNode;
}

/**
 * Protects demo routes by requiring:
 * 1. User to be authenticated
 * 2. User to have either 'developer' or 'admin' role
 */
export const DemoProtectedRoute = ({ children }: DemoProtectedRouteProps) => {
  const { roles, isAuthenticated, isLoading: roleLoading } = useDevRole();
  const [canAccess, setCanAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = () => {
      if (roleLoading) {
        return;
      }

      // Check if user is authenticated
      if (!isAuthenticated) {
        setCanAccess(false);
        return;
      }

      // Check if user has developer or admin role
      const hasDeveloperAccess = roles?.some(r => 
        r.role_name === ROLES.DEVELOPER || 
        r.role_name === ROLES.ADMIN ||
        r.permission_names.includes(PERMISSIONS.ALL)
      );
      
      setCanAccess(hasDeveloperAccess || false);
    };

    checkAccess();
  }, [isAuthenticated, roles, roleLoading]);

  // Still loading
  if (roleLoading || canAccess === null) {
    return <FmCommonLoadingState />;
  }

  // Access denied
  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  // Access granted
  return <>{children}</>;
};
