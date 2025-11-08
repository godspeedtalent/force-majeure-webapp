import { supabase } from '@/shared/api/supabase/client';

export interface Role {
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
  private roles: Role[] = [];
  private rolesMap: Map<string, Role> = new Map();
  private loading: boolean = false;
  private loaded: boolean = false;
  private listeners: Set<() => void> = new Set();

  /**
   * Get all roles from the store
   */
  getRoles(): Role[] {
    return this.roles;
  }

  /**
   * Get a role by its name
   */
  getRoleByName(name: string): Role | undefined {
    return this.rolesMap.get(name);
  }

  /**
   * Get a role by its ID
   */
  getRoleById(id: string): Role | undefined {
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
        console.error('Error loading roles:', error);
        throw error;
      }

      this.roles = data || [];
      this.rolesMap = new Map(this.roles.map(role => [role.name, role]));
      this.loaded = true;
      this.notify();

      console.log(`Loaded ${this.roles.length} roles into store`);
    } catch (error) {
      console.error('Failed to load roles:', error);
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
