import {
  ROLES,
  PERMISSIONS,
  type Role,
  type Permission,
} from '@/shared';

/**
 * Type guard to check if a string is a valid role
 * @param value - The string to check
 * @returns true if the value is a valid Role
 *
 * @example
 * ```typescript
 * const userRole = 'admin';
 * if (isRole(userRole)) {
 *   // TypeScript now knows userRole is of type Role
 *   console.log('Valid role:', userRole);
 * }
 * ```
 */
export const isRole = (value: string): value is Role => {
  return Object.values(ROLES).includes(value as Role);
};

/**
 * Type guard to check if a string is a valid permission
 * @param value - The string to check
 * @returns true if the value is a valid Permission
 *
 * @example
 * ```typescript
 * const perm = 'manage_users';
 * if (isPermission(perm)) {
 *   // TypeScript now knows perm is of type Permission
 *   console.log('Valid permission:', perm);
 * }
 * ```
 */
export const isPermission = (value: string): value is Permission => {
  return Object.values(PERMISSIONS).includes(value as Permission);
};

/**
 * Validate an array of roles and filter out invalid ones
 * @param roles - Array of strings to validate
 * @returns Array of valid Role values
 *
 * @example
 * ```typescript
 * const userRoles = ['admin', 'invalid_role', 'user'];
 * const validRoles = validateRoles(userRoles);
 * // Result: ['admin', 'user']
 * ```
 */
export const validateRoles = (roles: string[]): Role[] => {
  return roles.filter(isRole);
};

/**
 * Validate an array of permissions and filter out invalid ones
 * @param permissions - Array of strings to validate
 * @returns Array of valid Permission values
 *
 * @example
 * ```typescript
 * const userPermissions = ['manage_users', 'invalid_perm', 'view_analytics'];
 * const validPermissions = validatePermissions(userPermissions);
 * // Result: ['manage_users', 'view_analytics']
 * ```
 */
export const validatePermissions = (permissions: string[]): Permission[] => {
  return permissions.filter(isPermission);
};

/**
 * Get all available roles
 * @returns Array of all Role values
 */
export const getAllRoles = (): Role[] => {
  return Object.values(ROLES);
};

/**
 * Get all available permissions
 * @returns Array of all Permission values
 */
export const getAllPermissions = (): Permission[] => {
  return Object.values(PERMISSIONS);
};

/**
 * Check if a role name is valid without importing the full ROLES constant
 * Useful for validation in forms and APIs
 *
 * @param roleName - The role name to validate
 * @returns true if the role exists
 */
export const isValidRoleName = (roleName: unknown): roleName is Role => {
  return typeof roleName === 'string' && isRole(roleName);
};

/**
 * Check if a permission name is valid without importing the full PERMISSIONS constant
 * Useful for validation in forms and APIs
 *
 * @param permissionName - The permission name to validate
 * @returns true if the permission exists
 */
export const isValidPermissionName = (
  permissionName: unknown
): permissionName is Permission => {
  return typeof permissionName === 'string' && isPermission(permissionName);
};
