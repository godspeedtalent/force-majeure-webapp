import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/services/AuthContext';
import { supabase } from '@/shared/api/supabase/client';
import {
  PERMISSIONS,
  type Permission,
  type Role,
} from '@/shared/auth/permissions';

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
        console.error('Error fetching user roles:', error);
        return null;
      }

      return data as UserRole[];
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
   * Check if user has a specific permission
   * @param permission - Permission to check (use PERMISSIONS constant)
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!roles) return false;
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
   */
  const hasRole = (roleName: Role): boolean => {
    if (!roles) return false;
    return roles.some(role => role.role_name === roleName);
  };

  /**
   * Check if user has ANY of the specified roles
   * @param roleNames - Roles to check
   * @returns true if user has at least one of the roles
   */
  const hasAnyRole = (...roleNames: Role[]): boolean => {
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
