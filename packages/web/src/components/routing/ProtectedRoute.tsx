import { ReactNode, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { useAuth } from '@/features/auth/services/AuthContext';
import { Permission, Role } from '@/shared/auth/permissions';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Required permission(s) - user must have at least one */
  permission?: Permission | Permission[];
  /** Required role(s) - user must have at least one */
  role?: Role | Role[];
  /** Require ALL permissions instead of ANY */
  requireAll?: boolean;
  /** Where to redirect if unauthorized (defaults to /auth for unauthenticated, / for unauthorized) */
  redirectTo?: string;
}

/**
 * Route-level protection based on permissions/roles
 * Redirects unauthorized users to a specified route
 *
 * NOTE: Users with the 'admin' role automatically pass ALL permission and role checks
 * without needing to be assigned individual permissions or roles.
 *
 * @example
 * // Protect route by permission (admins bypass this check)
 * <Route
 *   path="/organization/tools"
 *   element={
 *     <ProtectedRoute permission={PERMISSIONS.MANAGE_ORGANIZATION}>
 *       <OrganizationTools />
 *     </ProtectedRoute>
 *   }
 * />
 *
 * @example
 * // Protect route by role (admins bypass this check)
 * <Route
 *   path="/dev/controls"
 *   element={
 *     <ProtectedRoute role={ROLES.DEVELOPER}>
 *       <DevControls />
 *     </ProtectedRoute>
 *   }
 * />
 *
 * @example
 * // Require multiple permissions (admins bypass this check)
 * <Route
 *   path="/advanced-tools"
 *   element={
 *     <ProtectedRoute
 *       permission={[PERMISSIONS.MANAGE_EVENTS, PERMISSIONS.SCAN_TICKETS]}
 *       requireAll
 *     >
 *       <AdvancedTools />
 *     </ProtectedRoute>
 *   }
 * />
 */
export const ProtectedRoute = ({
  children,
  permission,
  role,
  requireAll = false,
  redirectTo,
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasAllPermissions, hasAnyPermission, hasAnyRole, roles } =
    useUserPermissions();
  const navigate = useNavigate();
  const location = useLocation();

  const isLoading = authLoading || (user && !roles);

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated - redirect to auth page
    if (!user) {
      navigate(redirectTo || '/auth', {
        replace: true,
        state: { from: location },
      });
      return;
    }

    // If no permission/role requirements, just need to be authenticated
    if (!permission && !role) {
      return;
    }

    // Check permissions
    let hasAccess = true;
    if (permission) {
      const permissions = Array.isArray(permission) ? permission : [permission];
      hasAccess = requireAll
        ? hasAllPermissions(...permissions)
        : hasAnyPermission(...permissions);
    }

    // Check roles
    if (hasAccess && role) {
      const rolesList = Array.isArray(role) ? role : [role];
      hasAccess = hasAnyRole(...rolesList);
    }

    // Unauthorized - redirect to home or specified route
    if (!hasAccess) {
      navigate(redirectTo || '/', { replace: true });
    }
  }, [
    isLoading,
    user,
    navigate,
    redirectTo,
    permission,
    role,
    requireAll,
    hasAllPermissions,
    hasAnyPermission,
    hasAnyRole,
    location,
  ]);

  if (isLoading) {
    return <FmCommonLoadingState />;
  }

  if (!user) {
    return (
      <Navigate to={redirectTo || '/auth'} state={{ from: location }} replace />
    );
  }

  // If no permission/role requirements, just need to be authenticated
  if (!permission && !role) {
    return <>{children}</>;
  }

  // Final access check before rendering
  let hasAccess = true;
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    hasAccess = requireAll
      ? hasAllPermissions(...permissions)
      : hasAnyPermission(...permissions);
  }

  if (hasAccess && role) {
    const rolesList = Array.isArray(role) ? role : [role];
    hasAccess = hasAnyRole(...rolesList);
  }

  if (!hasAccess) {
    return <Navigate to={redirectTo || '/'} replace />;
  }

  return <>{children}</>;
};
