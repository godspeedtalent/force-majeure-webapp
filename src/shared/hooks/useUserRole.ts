import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { logger } from '@/shared';
import { debugAccessService } from '@/shared/services/debugAccessService';

import { useAuthSafe } from '@/features/auth/services/AuthContext';
import { supabase } from '@/shared';
import {
  PERMISSIONS,
  type Permission,
  type Role,
} from '@/shared';
import { useMockRoleSafe } from '@/shared/contexts/MockRoleContext';
import { rolesStore } from '@/shared/stores/rolesStore';

export interface UserRole {
  role_name: string;
  display_name: string;
  permission_names: string[];
}

const isAuthError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const err = error as Record<string, unknown>;
  const status = err.status;
  const code = err.code;
  const message =
    typeof err.message === 'string' ? err.message.toLowerCase() : '';

  return (
    status === 401 ||
    code === 401 ||
    code === '401' ||
    message.includes('jwt') ||
    message.includes('token') ||
    message.includes('not authenticated')
  );
};

export const useUserRole = () => {
  const auth = useAuthSafe();
  const user = auth?.user ?? null;

  const query = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return [];

      try {
        // Use the new helper function
        const { data, error } = await supabase.rpc('get_user_roles', {
          user_id_param: user.id,
        });

        if (error) {
          // Attempt a one-time session refresh if auth appears stale
          if (isAuthError(error)) {
            const { data: refreshData, error: refreshError } =
              await supabase.auth.refreshSession();

            if (!refreshError && refreshData.session) {
              const retry = await supabase.rpc('get_user_roles', {
                user_id_param: user.id,
              });

              if (!retry.error) {
                return (retry.data || []).map(role => ({
                  role_name: role.role_name,
                  display_name: role.display_name,
                  permission_names: Array.isArray(role.permission_names)
                    ? role.permission_names
                    : [],
                })) as UserRole[];
              }
            }
          }

          logger.error('Error fetching user roles:', { error });
          return [];
        }

        // Map database response to UserRole interface
        return (data || []).map(role => ({
          role_name: role.role_name,
          display_name: role.display_name,
          permission_names: Array.isArray(role.permission_names)
            ? role.permission_names
            : [],
        })) as UserRole[];
      } catch (error) {
        logger.error('Unexpected error fetching user roles:', { error });
        return [];
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sync debug access when roles load
  // This allows the logger and error components to check role-based access
  // even outside of React context (e.g., error boundaries)
  useEffect(() => {
    if (!user) {
      // User is anonymous or logged out - mark auth as resolved with no access
      // Note: We use setDebugAccess(false) instead of clearDebugAccess() because:
      // - clearDebugAccess() is called during signOut() to clear any buffered logs
      // - Here we just need to mark auth as resolved so buffered logs are discarded
      // - Using setDebugAccess(false) properly triggers the buffer flush/discard
      debugAccessService.setDebugAccess(false);
      return;
    }

    if (query.isFetched) {
      const roles = query.data || [];
      const isDevOrAdmin = roles.some(
        role => role.role_name === 'admin' || role.role_name === 'developer'
      );
      debugAccessService.setDebugAccess(isDevOrAdmin);
    }
  }, [query.data, query.isFetched, user]);

  return query;
};

/**
 * Enhanced permission checking with type safety
 * Provides comprehensive methods for checking user permissions and roles
 *
 * Supports mock role simulation for development/testing:
 * - When mock role is active, permission checks use the simulated roles
 * - Multiple roles can be simulated simultaneously
 * - Actual user roles are still available via `actualRoles` property
 * - Use `isMockActive` to check if simulation is enabled
 */
export const useUserPermissions = () => {
  const roleQuery = useUserRole();
  const roles = roleQuery.data;
  const {
    isMockActive,
    isUnauthenticated,
    getActiveMockRoles,
    getMockPermissions,
    mockRole, // Legacy compatibility
  } = useMockRoleSafe();

  /**
   * Get effective roles considering mock mode
   * When mock is active, returns simulated role data
   * When simulating unauthenticated, returns empty array (no roles)
   * Supports multiple simultaneous mock roles
   */
  const getEffectiveRoles = (): UserRole[] => {
    if (isMockActive) {
      // Unauthenticated simulation - return empty roles (logged out user)
      if (isUnauthenticated) {
        return [];
      }

      // Get all active mock roles
      const activeMockRoles = getActiveMockRoles();
      if (activeMockRoles.length === 0) return roles || [];

      // Build UserRole objects for each active mock role
      return activeMockRoles.map(roleName => {
        const roleRecord = rolesStore.getRoleByName(roleName);
        return {
          role_name: roleName,
          display_name: roleRecord?.display_name ||
            roleName.charAt(0).toUpperCase() + roleName.slice(1).replace(/_/g, ' '),
          permission_names: roleRecord?.permissions || [],
        };
      });
    }
    return roles || [];
  };

  /**
   * Check if simulating unauthenticated user
   */
  const isSimulatingUnauthenticated = isMockActive && isUnauthenticated;

  /**
   * Check if user is an admin
   * Admins automatically have all permissions without needing to check individual permissions
   * @returns true if user has the admin role
   */
  const isAdmin = (): boolean => {
    const effectiveRoles = getEffectiveRoles();
    if (effectiveRoles.length === 0) return false;
    return effectiveRoles.some(role => role.role_name === 'admin');
  };

  /**
   * Check if user has a specific permission
   * @param permission - Permission to check (use PERMISSIONS constant)
   * @returns true if user is admin OR has the specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    const effectiveRoles = getEffectiveRoles();
    if (effectiveRoles.length === 0) return false;
    // Admin role automatically grants all permissions
    if (isAdmin()) return true;
    return effectiveRoles.some(
      role =>
        role.permission_names.includes(PERMISSIONS.ALL) ||
        role.permission_names.includes(permission)
    );
  };

  /**
   * Check if user has ANY of the specified permissions
   * @param permissions - Permissions to check
   * @returns true if user has at least one of the permissions
   */
  const hasAnyPermission = (...permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  /**
   * Check if user has ALL of the specified permissions
   * @param permissions - Permissions to check
   * @returns true if user has all of the permissions
   */
  const hasAllPermissions = (...permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  /**
   * Check if user has a specific role
   * @param roleName - Role to check (use ROLES constant)
   * @returns true if user has the specified role
   * @note Admins are automatically considered developers
   */
  const hasRole = (roleName: Role): boolean => {
    const effectiveRoles = getEffectiveRoles();
    if (effectiveRoles.length === 0) return false;
    // Admins are automatically considered developers
    if (roleName === 'developer' && isAdmin()) return true;
    return effectiveRoles.some(role => role.role_name === roleName);
  };

  /**
   * Check if user has ANY of the specified roles
   * @param roleNames - Roles to check
   * @returns true if user is admin OR has at least one of the specified roles
   */
  const hasAnyRole = (...roleNames: Role[]): boolean => {
    // Admin role grants access to everything
    if (isAdmin()) return true;
    return roleNames.some(roleName => hasRole(roleName));
  };

  /**
   * Get all user's role names
   * @returns Array of role names the user has
   */
  const getRoles = (): Role[] => {
    const effectiveRoles = getEffectiveRoles();
    return effectiveRoles.map(role => role.role_name as Role);
  };

  /**
   * Get all user's permissions (flattened from all roles)
   * @returns Array of all permissions the user has
   */
  const getPermissions = (): Permission[] => {
    const effectiveRoles = getEffectiveRoles();
    if (effectiveRoles.length === 0) return [];
    const allPermissions = new Set<Permission>();
    effectiveRoles.forEach(role => {
      role.permission_names.forEach(perm =>
        allPermissions.add(perm as Permission)
      );
    });
    return Array.from(allPermissions);
  };

  /**
   * Check if the current user is actually an admin/developer
   * This bypasses mock role to check real permissions
   * Used for showing/hiding dev tools themselves
   */
  const isActuallyDeveloperOrAdmin = (): boolean => {
    if (!roles) return false;
    return roles.some(role =>
      role.role_name === 'admin' || role.role_name === 'developer'
    );
  };

  return {
    isAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    getRoles,
    getPermissions,
    roles,
    rolesLoading: roleQuery.isLoading,
    rolesLoaded: roleQuery.isFetched && !roleQuery.isLoading,
    rolesError: roleQuery.isError,
    // Mock role utilities
    isMockActive,
    mockRole,
    actualRoles: roles,
    isActuallyDeveloperOrAdmin,
    isSimulatingUnauthenticated,
    // New multi-role utilities
    getActiveMockRoles,
    getMockPermissions,
    isUnauthenticated,
  };
};
