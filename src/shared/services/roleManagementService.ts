import { supabase } from '@/shared';
import { logger } from '@/shared';
import { handleError } from '@/shared/services/errorHandler';
import i18n from '@/i18n';

const roleLogger = logger.createNamespace('RoleManagement');

/**
 * Service for managing user roles
 * Provides CRUD operations for user role assignments
 */
export class RoleManagementService {
  /**
   * Get role ID by name (private helper to reduce duplication)
   * @param roleName - The name of the role
   * @returns The role ID or null if not found
   */
  private static async getRoleIdByName(roleName: string): Promise<string | null> {
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single();

    if (roleError) {
      roleLogger.error('Failed to fetch role', { roleName, error: roleError });
      return null;
    }

    return roleData?.id ?? null;
  }

  /**
   * Add a role to a user
   * @param userId - The user's ID
   * @param roleName - The name of the role to add
   * @throws Error if role doesn't exist or operation fails
   */
  static async addRole(userId: string, roleName: string): Promise<void> {
    try {
      roleLogger.debug('Adding role to user', { userId, roleName });

      const roleId = await this.getRoleIdByName(roleName);
      if (!roleId) {
        throw new Error(`Role "${roleName}" not found`);
      }

      // Insert the user_role relationship (upsert to handle duplicates gracefully)
      const payload = {
        user_id: userId,
        role_id: roleId,
      };

      const { error: insertError } = await supabase
        .from('user_roles')
        .upsert([payload], {
          onConflict: 'user_id,role_id',
          ignoreDuplicates: true
        });

      if (insertError) {
        // Only throw if it's not a duplicate key error (409 is handled by upsert)
        roleLogger.error('Failed to add role to user', {
          userId,
          roleName,
          error: insertError,
        });
        throw insertError;
      }

      roleLogger.info('Role added successfully', { userId, roleName });
    } catch (error) {
      roleLogger.error('Error in addRole', { userId, roleName, error });
      await handleError(error, {
        title: i18n.t('admin.roleAddFailed', { ns: 'toasts' }),
        description: i18n.t('admin.roleAddFailedDescription', { ns: 'toasts', roleName }),
        endpoint: 'user_roles',
        method: 'INSERT',
        context: 'Role management service',
      });
      throw error;
    }
  }

  /**
   * Remove a role from a user
   * @param userId - The user's ID
   * @param roleName - The name of the role to remove
   * @throws Error if role doesn't exist or operation fails
   */
  static async removeRole(userId: string, roleName: string): Promise<void> {
    try {
      roleLogger.debug('Removing role from user', { userId, roleName });

      const roleId = await this.getRoleIdByName(roleName);
      if (!roleId) {
        throw new Error(`Role "${roleName}" not found`);
      }

      // Delete the user_role relationship
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (deleteError) {
        roleLogger.error('Failed to remove role from user', {
          userId,
          roleName,
          error: deleteError,
        });
        throw deleteError;
      }

      roleLogger.info('Role removed successfully', { userId, roleName });
    } catch (error) {
      roleLogger.error('Error in removeRole', { userId, roleName, error });
      throw error;
    }
  }

  /**
   * Check if a user has a specific role
   * @param userId - The user's ID
   * @param roleName - The name of the role to check
   * @returns Promise<boolean> - true if user has the role
   */
  static async hasRole(userId: string, roleName: string): Promise<boolean> {
    try {
      const roleId = await this.getRoleIdByName(roleName);
      if (!roleId) {
        return false;
      }

      // Check if user_role exists
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .maybeSingle();

      if (error) {
        roleLogger.error('Error checking if user has role', {
          userId,
          roleName,
          error,
        });
        return false;
      }

      return !!data;
    } catch (error) {
      roleLogger.error('Error in hasRole', { userId, roleName, error });
      return false;
    }
  }

  /**
   * Get all roles for a user
   * @param userId - The user's ID
   * @returns Promise<string[]> - Array of role names
   */
  static async getUserRoles(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', userId);

      if (error) {
        roleLogger.error('Failed to fetch user roles', { userId, error });
        throw error;
      }

      return (data || [])
        .map(item => item.roles?.name)
        .filter((name): name is string => typeof name === 'string');
    } catch (error) {
      roleLogger.error('Error in getUserRoles', { userId, error });
      return [];
    }
  }

  /**
   * Get all available roles in the system
   * @returns Promise<Array<{id: string, name: string}>>
   */
  static async getAllRoles(): Promise<Array<{ id: string; name: string }>> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name')
        .order('name');

      if (error) {
        roleLogger.error('Failed to fetch all roles', { error });
        throw error;
      }

      return data || [];
    } catch (error) {
      roleLogger.error('Error in getAllRoles', { error });
      return [];
    }
  }
}
