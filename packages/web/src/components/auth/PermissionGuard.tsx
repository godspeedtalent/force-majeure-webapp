import { ReactNode } from 'react';
import { useUserPermissions } from '@force-majeure/shared/hooks/useUserRole';
import { Permission, Role } from '@force-majeure/shared/auth/permissions';

interface PermissionGuardProps {
  children: ReactNode;
  /** Required permission(s) - user must have at least one */
  permission?: Permission | Permission[];
  /** Required role(s) - user must have at least one */
  role?: Role | Role[];
  /** Require ALL permissions instead of ANY */
  requireAll?: boolean;
  /** What to show when access is denied */
  fallback?: ReactNode;
}

/**
 * Guard component that shows children only if user has required permissions/roles
 *
 * NOTE: Users with the 'admin' role automatically pass ALL permission and role checks
 * without needing to be assigned individual permissions or roles.
 *
 * @example
 * // Show content only if user can manage organizations (or is admin)
 * <PermissionGuard permission={PERMISSIONS.MANAGE_ORGANIZATION}>
 *   <OrganizationTools />
 * </PermissionGuard>
 *
 * @example
 * // Show content only if user has developer role (or is admin)
 * <PermissionGuard role={ROLES.DEVELOPER}>
 *   <DevControls />
 * </PermissionGuard>
 *
 * @example
 * // Show content only if user has ALL specified permissions (or is admin)
 * <PermissionGuard
 *   permission={[PERMISSIONS.MANAGE_EVENTS, PERMISSIONS.SCAN_TICKETS]}
 *   requireAll
 * >
 *   <AdvancedEventTools />
 * </PermissionGuard>
 */
export const PermissionGuard = ({
  children,
  permission,
  role,
  requireAll = false,
  fallback = null,
}: PermissionGuardProps) => {
  const {
    hasAllPermissions,
    hasAnyPermission,
    hasAnyRole,
  } = useUserPermissions();

  let hasAccess = true;

  // Check permissions
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    hasAccess = requireAll
      ? hasAllPermissions(...permissions)
      : hasAnyPermission(...permissions);
  }

  // Check roles (if permissions check passed or no permissions specified)
  if (hasAccess && role) {
    const roles = Array.isArray(role) ? role : [role];
    hasAccess = hasAnyRole(...roles);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
