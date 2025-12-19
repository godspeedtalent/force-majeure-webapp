import { supabase } from '@/shared';
import { logger } from '@/shared';
import type { Tables } from '@/shared';

export interface RoleRecord {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  permissions: string[];
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

class RolesStore {
  private roles: RoleRecord[] = [];
  private rolesMap: Map<string, RoleRecord> = new Map();
  private loading: boolean = false;
  private loaded: boolean = false;
  private listeners: Set<() => void> = new Set();

  /**
   * Get all roles from the store
   */
  getRoles(): RoleRecord[] {
    return this.roles;
  }

  /**
   * Get a role by its name
   */
  getRoleByName(name: string): RoleRecord | undefined {
    return this.rolesMap.get(name);
  }

  /**
   * Get a role by its ID
   */
  getRoleById(id: string): RoleRecord | undefined {
    return this.roles.find(role => role.id === id);
  }

  /**
   * Get role display name by role name
   */
  getDisplayName(roleName: string): string {
    return this.rolesMap.get(roleName)?.display_name || roleName;
  }

  /**
   * Check if roles have been loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Check if roles are currently loading
   */
  isLoading(): boolean {
    return this.loading;
  }

  /**
   * Subscribe to role changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Load roles from database
   */
  async loadRoles(): Promise<void> {
    if (this.loading || this.loaded) {
      return;
    }

    this.loading = true;

    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) {
        logger.error('Error loading roles:', { error });
        throw error;
      }

      const dbRoles = (data || []) as Tables<'roles'>[];

      this.roles = dbRoles.map(role => ({
        id: role.id,
        name: role.name,
        display_name: role.display_name,
        description: role.description,
        permissions: Array.isArray(role.permissions)
          ? (role.permissions as string[])
          : [],
        is_system_role: !!role.is_system_role,
        created_at: role.created_at ?? '',
        updated_at: role.updated_at ?? '',
      }));

      this.rolesMap = new Map(this.roles.map(role => [role.name, role]));
      this.loaded = true;
      this.notify();

      logger.info('Loaded roles into store', { count: this.roles.length });
    } catch (error) {
      logger.error('Failed to load roles:', { error });
      throw error;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Refresh roles from database
   */
  async refresh(): Promise<void> {
    this.loaded = false;
    await this.loadRoles();
  }

  /**
   * Clear the store
   */
  clear(): void {
    this.roles = [];
    this.rolesMap.clear();
    this.loaded = false;
    this.notify();
  }
}

// Export singleton instance
export const rolesStore = new RolesStore();
