import { useQuery } from '@tanstack/react-query';
import { logger } from '@force-majeure/shared';

import { useAuth } from '@/features/auth/services/AuthContext';
import { supabase } from '@force-majeure/shared';
import {
  PERMISSIONS,
  type Permission,
  type Role,
} from '@force-majeure/shared';

export interface UserRole {
  role_name: string;
  display_name: string;
  permission_names: string[];
}

export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Use the new helper function
      const { data, error } = await supabase.rpc('get_user_roles', {
        user_id_param: user.id,
      });

      if (error) {
        logger.error('Error fetching user roles:', { error });
        return null;
      }

      // Map database response to UserRole interface
      return (data || []).map(role => ({
        role_name: role.role_name,
        display_name: role.display_name,
        permission_names: Array.isArray(role.permissions)
          ? role.permissions
          : [],
      })) as UserRole[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Enhanced permission checking with type safety
 * Provides comprehensive methods for checking user permissions and roles
 */
export const useUserPermissions = () => {
  const { data: roles } = useUserRole();

  /**
   * Check if user is an admin
   * Admins automatically have all permissions without needing to check individual permissions
   * @returns true if user has the admin role
   */
  const isAdmin = (): boolean => {
    if (!roles) return false;
    return roles.some(role => role.role_name === 'admin');
  };

  /**
   * Check if user has a specific permission
   * @param permission - Permission to check (use PERMISSIONS constant)
   * @returns true if user is admin OR has the specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!roles) return false;
    // Admin role automatically grants all permissions
    if (isAdmin()) return true;
    return roles.some(
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
    if (!roles) return false;
    // Admins are automatically considered developers
    if (roleName === 'developer' && isAdmin()) return true;
    return roles.some(role => role.role_name === roleName);
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
    if (!roles) return [];
    return roles.map(role => role.role_name as Role);
  };

  /**
   * Get all user's permissions (flattened from all roles)
   * @returns Array of all permissions the user has
   */
  const getPermissions = (): Permission[] => {
    if (!roles) return [];
    const allPermissions = new Set<Permission>();
    roles.forEach(role => {
      role.permission_names.forEach(perm =>
        allPermissions.add(perm as Permission)
      );
    });
    return Array.from(allPermissions);
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
  };
};
