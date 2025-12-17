import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared';

interface DemoProtectedRouteProps {
  children: ReactNode;
}

/**
 * Protects demo routes by requiring:
 * 1. User to be authenticated
 * 2. User to have either 'developer' or 'admin' role
 */
export const DemoProtectedRoute = ({ children }: DemoProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { hasAnyRole, roles } = useUserPermissions();

  // Still loading
  if (loading || roles === undefined) {
    return <FmCommonLoadingState />;
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to='/' replace />;
  }

  // Check if user has developer or admin role
  const hasDeveloperAccess = hasAnyRole(ROLES.DEVELOPER, ROLES.ADMIN);

  // Access denied
  if (!hasDeveloperAccess) {
    return <Navigate to='/' replace />;
  }

  // Access granted
  return <>{children}</>;
};
