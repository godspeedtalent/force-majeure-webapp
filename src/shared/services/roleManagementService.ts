import { supabase } from '@/shared/api/supabase/client';
import { logger } from '@/shared/services/logger';
import { handleError } from '@/shared/services/errorHandler';
import type { TablesInsert, Enums } from '@/integrations/supabase/types';

const roleLogger = logger.createNamespace('RoleManagement');

/**
 * Service for managing user roles
 * Provides CRUD operations for user role assignments
 */
export class RoleManagementService {
  /**
   * Add a role to a user
   * @param userId - The user's ID
   * @param roleName - The name of the role to add
   * @throws Error if role doesn't exist or operation fails
   */
  static async addRole(userId: string, roleName: string): Promise<void> {
    try {
      roleLogger.debug('Adding role to user', { userId, roleName });

      // Get the role_id for the selected role name
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single();

      if (roleError) {
        roleLogger.error('Failed to fetch role', {
          roleName,
          error: roleError,
        });
        throw roleError;
      }

      if (!roleData) {
        throw new Error(`Role "${roleName}" not found`);
      }

      // Insert the user_role relationship
      const payload: TablesInsert<'user_roles'> = {
        user_id: userId,
        role_id: roleData.id,
        role: roleName as Enums<'app_role'>,
      };

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert(payload);

      if (insertError) {
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
        title: 'Failed to Add Role',
        description: `Could not assign role "${roleName}" to user`,
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

      // Get the role_id for the selected role name
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single();

      if (roleError) {
        roleLogger.error('Failed to fetch role', {
          roleName,
          error: roleError,
        });
        throw roleError;
      }

      if (!roleData) {
        throw new Error(`Role "${roleName}" not found`);
      }

      // Delete the user_role relationship
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleData.id);

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
      // Get the role_id for the role name
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single();

      if (roleError || !roleData) {
        return false;
      }

      // Check if user_role exists
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role_id', roleData.id)
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
