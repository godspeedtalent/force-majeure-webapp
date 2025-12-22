import { ROLES, PERMISSIONS, } from '@/shared';
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
export const isRole = (value) => {
    return Object.values(ROLES).includes(value);
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
export const isPermission = (value) => {
    return Object.values(PERMISSIONS).includes(value);
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
export const validateRoles = (roles) => {
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
export const validatePermissions = (permissions) => {
    return permissions.filter(isPermission);
};
/**
 * Get all available roles
 * @returns Array of all Role values
 */
export const getAllRoles = () => {
    return Object.values(ROLES);
};
/**
 * Get all available permissions
 * @returns Array of all Permission values
 */
export const getAllPermissions = () => {
    return Object.values(PERMISSIONS);
};
/**
 * Check if a role name is valid without importing the full ROLES constant
 * Useful for validation in forms and APIs
 *
 * @param roleName - The role name to validate
 * @returns true if the role exists
 */
export const isValidRoleName = (roleName) => {
    return typeof roleName === 'string' && isRole(roleName);
};
/**
 * Check if a permission name is valid without importing the full PERMISSIONS constant
 * Useful for validation in forms and APIs
 *
 * @param permissionName - The permission name to validate
 * @returns true if the permission exists
 */
export const isValidPermissionName = (permissionName) => {
    return typeof permissionName === 'string' && isPermission(permissionName);
};
